// data-api: server-side API framför Neon-databasen.
// Neon-inloggningen (DATABASE_URL) är en server-hemlig och lämnar aldrig servern.
// Publika actions är öppna; admin-actions kräver giltig Supabase-inloggning + admin-roll.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { neon } from "https://esm.sh/@neondatabase/serverless@0.10.4";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const sql = neon(Deno.env.get("DATABASE_URL")!);

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Verifierar Supabase-JWT och att användaren har admin-roll i user_roles.
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

// Actions som är öppna för allmänheten (läsa publicerat innehåll + skapa anmälan).
const PUBLIC_ACTIONS = new Set([
  "trips.listPublished",
  "trips.get",
  "trips.counts",
  "pageContent.get",
  "registrations.create",
  // Capability-länk: en registrant läser/kompletterar SIN egen anmälan via dess UUID.
  "registrations.getOne",
  "registrations.updateOwn",
]);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let body: { action?: string; params?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Ogiltig JSON" }, 400);
  }
  const action = body.action ?? "";
  const p = body.params ?? {};

  // Admin-gate för allt som inte är publikt.
  if (!PUBLIC_ACTIONS.has(action)) {
    const gate = await requireAdmin(req);
    if (!gate.ok) return gate.res;
  }

  try {
    switch (action) {
      // ---------- TRIPS ----------
      case "trips.listPublished":
        return json(await sql`SELECT * FROM trips WHERE status = 'published' ORDER BY start_date DESC`);

      case "trips.listAll":
        return json(await sql`SELECT * FROM trips ORDER BY start_date DESC`);

      case "trips.get": {
        const rows = await sql`SELECT * FROM trips WHERE id = ${p.id as string}`;
        return json(rows[0] ?? null);
      }

      case "trips.counts":
        return json(await sql`SELECT trip_id, count(*)::int AS n FROM registrations GROUP BY trip_id`);

      case "trips.save": {
        const t = p as Record<string, any>;
        if (t.id) {
          const rows = await sql`
            UPDATE trips SET
              title=COALESCE(${t.title ?? null},title), description=COALESCE(${t.description ?? null},description),
              destination=COALESCE(${t.destination ?? null},destination), category=COALESCE(${t.category ?? null},category),
              start_date=COALESCE(${t.start_date ?? null},start_date), end_date=COALESCE(${t.end_date ?? null},end_date),
              price=COALESCE(${t.price ?? null},price), currency=COALESCE(${t.currency ?? null},currency),
              max_participants=COALESCE(${t.max_participants ?? null},max_participants),
              show_spots_left=COALESCE(${t.show_spots_left ?? null},show_spots_left),
              spots_left_threshold=${t.spots_left_threshold ?? null},
              image_url=COALESCE(${t.image_url ?? null},image_url), image_position=${t.image_position ?? null},
              status=COALESCE(${t.status ?? null},status),
              form_fields=COALESCE(${t.form_fields ? JSON.stringify(t.form_fields) : null},form_fields),
              presentation_fields=COALESCE(${t.presentation_fields ? JSON.stringify(t.presentation_fields) : null},presentation_fields),
              additional_dates=${t.additional_dates ? JSON.stringify(t.additional_dates) : null},
              promo_codes=${t.promo_codes ? JSON.stringify(t.promo_codes) : null},
              payment_info=${t.payment_info ? JSON.stringify(t.payment_info) : null}
            WHERE id=${t.id} RETURNING *`;
          return json(rows[0]);
        }
        const rows = await sql`
          INSERT INTO trips (title, description, destination, category, start_date, end_date, price, currency, max_participants, show_spots_left, spots_left_threshold, image_url, image_position, status, form_fields, presentation_fields, additional_dates, promo_codes, payment_info)
          VALUES (${t.title}, ${t.description}, ${t.destination}, ${t.category}, ${t.start_date}, ${t.end_date}, ${t.price}, ${t.currency}, ${t.max_participants}, ${t.show_spots_left}, ${t.spots_left_threshold ?? null}, ${t.image_url}, ${t.image_position ?? null}, ${t.status}, ${JSON.stringify(t.form_fields)}, ${JSON.stringify(t.presentation_fields)}, ${t.additional_dates ? JSON.stringify(t.additional_dates) : null}, ${t.promo_codes ? JSON.stringify(t.promo_codes) : null}, ${t.payment_info ? JSON.stringify(t.payment_info) : null})
          RETURNING *`;
        return json(rows[0]);
      }

      case "trips.duplicate": {
        const src = (await sql`SELECT * FROM trips WHERE id = ${p.id as string}`)[0];
        if (!src) return json({ error: "Trip not found" }, 404);
        const rows = await sql`
          INSERT INTO trips (title, description, destination, category, start_date, end_date, price, currency, max_participants, show_spots_left, spots_left_threshold, image_url, image_position, status, form_fields, presentation_fields, additional_dates, promo_codes, payment_info)
          VALUES (${`${src.title} (kopia)`}, ${src.description}, ${src.destination}, ${src.category}, ${src.start_date}, ${src.end_date}, ${src.price}, ${src.currency}, ${src.max_participants}, ${src.show_spots_left}, ${src.spots_left_threshold ?? null}, ${src.image_url}, ${src.image_position ?? null}, ${"draft"}, ${JSON.stringify(src.form_fields)}, ${JSON.stringify(src.presentation_fields)}, ${src.additional_dates ? JSON.stringify(src.additional_dates) : null}, ${src.promo_codes ? JSON.stringify(src.promo_codes) : null}, ${src.payment_info ? JSON.stringify(src.payment_info) : null})
          RETURNING *`;
        return json(rows[0]);
      }

      case "trips.delete":
        await sql`DELETE FROM trips WHERE id = ${p.id as string}`;
        return json({ ok: true });

      // ---------- REGISTRATIONS ----------
      case "registrations.create": {
        const r = p as Record<string, any>;
        const rows = await sql`
          INSERT INTO registrations (trip_id, form_data, presentation_data)
          VALUES (${r.trip_id}, ${JSON.stringify(r.form_data)}, ${r.presentation_data ? JSON.stringify(r.presentation_data) : null})
          RETURNING *`;
        return json(rows[0]);
      }

      case "registrations.createMany": {
        const regs = (p.regs as Record<string, any>[]) ?? [];
        const out = [];
        for (const r of regs) {
          const rows = await sql`
            INSERT INTO registrations (trip_id, form_data, presentation_data)
            VALUES (${r.trip_id}, ${JSON.stringify(r.form_data)}, ${r.presentation_data ? JSON.stringify(r.presentation_data) : null})
            RETURNING *`;
          out.push(rows[0]);
        }
        return json(out);
      }

      // PUBLIK via capability-UUID: registrantens egen anmälan.
      case "registrations.getOne": {
        const rows = await sql`SELECT * FROM registrations WHERE id = ${p.id as string}`;
        return json(rows[0] ?? null);
      }

      // PUBLIK via capability-UUID: uppdaterar ENDAST kundens egna fält (ej betalning/admin).
      case "registrations.updateOwn": {
        const u = p as Record<string, any>;
        const rows = await sql`
          UPDATE registrations SET
            form_data = COALESCE(${u.form_data ? JSON.stringify(u.form_data) : null}, form_data),
            presentation_data = COALESCE(${u.presentation_data ? JSON.stringify(u.presentation_data) : null}, presentation_data)
          WHERE id = ${u.id} RETURNING *`;
        return json(rows[0]);
      }

      case "registrations.list": {
        const tripId = p.tripId as string | undefined;
        return json(
          tripId
            ? await sql`SELECT * FROM registrations WHERE trip_id = ${tripId} ORDER BY created_at ASC`
            : await sql`SELECT * FROM registrations ORDER BY created_at ASC`,
        );
      }

      case "registrations.get": {
        const rows = await sql`SELECT * FROM registrations WHERE id = ${p.id as string}`;
        return json(rows[0] ?? null);
      }

      case "registrations.update": {
        const u = p as Record<string, any>;
        const rows = await sql`
          UPDATE registrations SET
            payment_status = COALESCE(${u.payment_status ?? null}, payment_status),
            payment_note = COALESCE(${u.payment_note ?? null}, payment_note),
            form_data = COALESCE(${u.form_data ? JSON.stringify(u.form_data) : null}, form_data),
            presentation_data = COALESCE(${u.presentation_data ? JSON.stringify(u.presentation_data) : null}, presentation_data),
            ai_summary = COALESCE(${u.ai_summary ?? null}, ai_summary)
          WHERE id = ${u.id} RETURNING *`;
        return json(rows[0]);
      }

      case "registrations.delete":
        await sql`DELETE FROM registrations WHERE id = ${p.id as string}`;
        return json({ ok: true });

      // ---------- PAGE CONTENT ----------
      case "pageContent.get": {
        const rows = await sql`SELECT content FROM page_content WHERE slug = ${p.slug as string}`;
        return json(rows.length ? rows[0].content : {});
      }

      case "pageContent.save":
        await sql`
          INSERT INTO page_content (slug, content, updated_at)
          VALUES (${p.slug as string}, ${JSON.stringify(p.content)}::jsonb, now())
          ON CONFLICT (slug) DO UPDATE SET content = EXCLUDED.content, updated_at = now()`;
        return json({ ok: true });

      default:
        return json({ error: `Okänd action: ${action}` }, 400);
    }
  } catch (e) {
    console.error("data-api error", action, e);
    return json({ error: String(e) }, 500);
  }
});
