// parse-itinerary: admin laddar upp ett resenärsschema (PDF) i dashboarden,
// Claude läser PDF:en och returnerar ett strukturerat schema (TripItinerary)
// som sparas på resan och visas som tidslinje på bokningssidan.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Samma admin-gate som data-api: giltig Supabase-session + admin-roll.
async function requireAdmin(req: Request): Promise<{ ok: true } | { ok: false; res: Response }> {
  const auth = req.headers.get("Authorization") ?? "";
  const token = auth.replace(/^Bearer\s+/i, "");
  if (!token) return { ok: false, res: json({ error: "Ej inloggad" }, 401) };

  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: userData, error } = await userClient.auth.getUser();
  if (error || !userData.user) return { ok: false, res: json({ error: "Ogiltig session" }, 401) };

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const { data: roles } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", userData.user.id);
  const isAdmin = (roles ?? []).some((r: { role: string }) => r.role === "admin");
  if (!isAdmin) return { ok: false, res: json({ error: "Behörighet saknas" }, 403) };

  return { ok: true };
}

const ITINERARY_SCHEMA = {
  type: "object",
  properties: {
    intro: { type: "string", description: "Välkomsttext/inledning från dokumentet, utan rubrik." },
    sections: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string", description: "Sektionsrubrik, t.ex. 'Resefakta' eller 'Söndag 9 augusti – Avresa'." },
          intro: { type: "string", description: "Löptext före punkterna i sektionen." },
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                time: { type: "string", description: "Klockslag om punkten är tidsatt, t.ex. '12.30', 'Ca 19.00', '15.00–15.30', 'Senast 11.00', 'Morgon'. Utelämna helt för punkter utan tid." },
                text: { type: "string", description: "Punktens text, utan tid och utan listmarkör." },
              },
              required: ["text"],
              additionalProperties: false,
            },
          },
          outro: { type: "string", description: "Löptext efter punkterna, t.ex. 'Övernattning på hotellet.'" },
        },
        required: ["title", "items"],
        additionalProperties: false,
      },
    },
    outro: { type: "string", description: "Avslutande hälsning, t.ex. 'Trevlig resa! ... Vi ses ombord!'" },
  },
  required: ["sections"],
  additionalProperties: false,
};

const SYSTEM = `Du strukturerar resenärsscheman för en svensk bussresearrangör.

Du får ett reseprogram som PDF. Extrahera HELA innehållet troget till det angivna JSON-formatet:
- Behåll all text på svenska, ordagrant där det går. Hitta inte på något som inte står i dokumentet.
- Varje rubrik i dokumentet blir en sektion, i samma ordning som i dokumentet.
- Tidsatta rader (t.ex. "12.30 — Avresa från Strandvallen") delas i time + text.
- Undersektioner med egen rubrik (t.ex. "Tider", "Resedokument" under "Viktig information") blir egna punkter i formen "Rubrik: text", eller egna sektioner om de är omfattande.
- Dokumentets titelblock (resmål, datum, match) behöver inte bli en egen sektion — det visas redan på sidan.
- Välkomsttexten läggs i intro och avslutningen i outro.`;

async function parseItinerary(pdfBase64: string): Promise<unknown> {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY saknas på Supabase-projektet");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-opus-5",
      max_tokens: 16000,
      system: SYSTEM,
      output_config: {
        effort: "medium",
        format: { type: "json_schema", schema: ITINERARY_SCHEMA },
      },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "document",
              source: { type: "base64", media_type: "application/pdf", data: pdfBase64 },
            },
            { type: "text", text: "Strukturera detta resenärsschema." },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error("Anthropic API error", res.status, body);
    throw new Error(`AI-tjänsten svarade med fel (${res.status})`);
  }

  const data = await res.json();
  if (data.stop_reason === "refusal") {
    throw new Error("AI-tjänsten kunde inte behandla dokumentet");
  }
  if (data.stop_reason === "max_tokens") {
    throw new Error("Dokumentet är för långt — dela upp det eller korta ner det");
  }
  const text = (data.content ?? []).filter((b: { type: string }) => b.type === "text").map((b: { text: string }) => b.text).join("");
  return JSON.parse(text);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const gate = await requireAdmin(req);
  if (!gate.ok) return gate.res;

  try {
    const { pdf_base64 } = await req.json();
    if (typeof pdf_base64 !== "string" || !pdf_base64) {
      return json({ error: "pdf_base64 saknas" }, 400);
    }
    // Anthropic tar emot upp till 32 MB per request; håll god marginal.
    if (pdf_base64.length > 20_000_000) {
      return json({ error: "PDF:en är för stor (max ca 15 MB)" }, 413);
    }
    const itinerary = await parseItinerary(pdf_base64);
    return json({ success: true, itinerary });
  } catch (e) {
    console.error("parse-itinerary error", e);
    return json({ success: false, error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
