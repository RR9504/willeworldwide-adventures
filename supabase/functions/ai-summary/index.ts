import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface QA {
  question: string;
  answer: string;
}

interface SummaryRequest {
  name: string;
  tripTitle?: string;
  answers: QA[];
}

const SYSTEM = `Du är en lekfull och varm presentationsförfattare för en svensk resegrupp.

Skriv en kort presentation (3–5 meningar, runt 60–100 ord) av personen utifrån svaren nedan. Tilltala läsaren som om du presenterar personen för medresenärerna på resan.

Stil:
- Lättsam och personlig, gärna med en gnutta humor — men aldrig på personens bekostnad.
- Hitta det charmiga, unika eller överraskande i svaren och lyft fram det.
- Skriv flytande prosa, inte punktlista. Inga rubriker, inga citat från frågorna.
- Använd hen, han eller hon utifrån namnet om det är tydligt — annars använd förnamnet.
- Hitta INTE på fakta som inte finns i svaren. Om något saknas, hoppa bara över det.

Svara med BARA presentationstexten, ingen meta-text, ingen rubrik, ingen "Här är en presentation:".`;

async function generateSummary(name: string, tripTitle: string | undefined, answers: QA[]): Promise<string> {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY saknas på Supabase-projektet");

  const qaText = answers
    .filter(a => a.answer && a.answer.trim() !== "")
    .map(a => `${a.question}\n${a.answer}`)
    .join("\n\n");

  if (!qaText) throw new Error("Inga svar att sammanfatta");

  const userMsg = `Person: ${name}${tripTitle ? `\nResa: ${tripTitle}` : ""}\n\nSvar:\n${qaText}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 400,
      system: SYSTEM,
      messages: [{ role: "user", content: userMsg }],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Anthropic API ${res.status}: ${text}`);
  }
  const data = await res.json();
  const text = data?.content?.[0]?.text;
  if (typeof text !== "string" || !text.trim()) throw new Error("Tomt svar från Anthropic");
  return text.trim();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  try {
    const body: SummaryRequest = await req.json();
    if (!body.name || !Array.isArray(body.answers)) {
      return new Response(JSON.stringify({ success: false, error: "Felaktig payload (name + answers krävs)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const summary = await generateSummary(body.name, body.tripTitle, body.answers);
    return new Response(JSON.stringify({ success: true, summary }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: String(err instanceof Error ? err.message : err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
