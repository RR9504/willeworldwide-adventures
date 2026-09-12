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

// Idempotent schemauppdatering vid kallstart — Neon nås bara härifrån,
// så nya kolumner läggs till här i stället för via separata migrationssteg.
const schemaReady = (async () => {
  await sql`ALTER TABLE trips ADD COLUMN IF NOT EXISTS info_files jsonb`;
  // Utskickslogg: en rad per mottagare och försök. Mejl/SMS går via ett annat
  // Supabase-projekt (gratisplan, pausas vid inaktivitet) och sparades tidigare
  // ingenstans — ett misslyckat utskick försvann spårlöst. Nu syns det här och
  // kan skickas om från portalen. Inga främmande nycklar: loggen ska överleva
  // att en anmälan eller resa raderas.
  await sql`CREATE TABLE IF NOT EXISTS message_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamptz NOT NULL DEFAULT now(),
    kind text NOT NULL,
    channel text NOT NULL,
    trip_id uuid,
    registration_id uuid,
    recipient_name text NOT NULL DEFAULT '',
    recipient_email text,
    recipient_phone text,
    subject text,
    message text NOT NULL,
    status text NOT NULL,
    email_ok boolean,
    sms_ok boolean,
    error text,
    resent_from uuid
  )`;
  await sql`CREATE INDEX IF NOT EXISTS message_log_created_at_idx ON message_log (created_at DESC)`;
})().catch((e) => console.error("schema migration failed", e));

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

// ---------- MEJL/SMS via mejl/SMS-projektet ----------
// send-message ligger på ett ANNAT Supabase-projekt (seprpsyzqmppsnmzptyo, konto
// robin.ruuska@live.se, gratisplan). Se src/lib/messaging.ts och .github/workflows/keepalive.yml.
const MAIL_PROJECT_URL = "https://seprpsyzqmppsnmzptyo.supabase.co";
const SEND_TIMEOUT_MS = 120_000;
const MAX_RECIPIENTS = 500;

type Channel = "email" | "sms" | "both";
type MessageKind = "admin" | "registration" | "order_confirmation";
type MessageStatus = "sent" | "failed" | "partial";

interface OutgoingRecipient {
  name: string;
  email?: string;
  phone?: string;
  registration_id?: string;
}

/** Utfall per mottagare så som send-message rapporterar det. */
interface SendResult {
  recipient: string;
  sms?: boolean;
  email?: boolean;
  errors: string[];
}

const CHANNELS: Channel[] = ["email", "sms", "both"];
const KINDS: MessageKind[] = ["admin", "registration", "order_confirmation"];

/**
 * Status för en loggrad utifrån vad send-message svarade för den mottagaren.
 * sms/email är undefined när kanalen inte ens försöktes (kontaktuppgift saknas).
 */
function statusFromResult(r: SendResult | undefined): { status: MessageStatus; error: string | null } {
  if (!r) return { status: "failed", error: "Inget svar för mottagaren från mejl/SMS-tjänsten" };
  const attempted = r.sms !== undefined || r.email !== undefined;
  if (!attempted) return { status: "failed", error: "Kontaktuppgift saknas för den valda kanalen" };
  if (r.errors.length === 0) return { status: "sent", error: null };
  const anyOk = r.sms === true || r.email === true;
  return { status: anyOk ? "partial" : "failed", error: r.errors.join("; ") };
}

/**
 * Skickar via send-message och loggar en rad per mottagare — även när tjänsten
 * inte går att nå alls. Det är hela poängen: ett utskick som aldrig kom fram
 * ska synas i portalen och gå att skicka om.
 */
async function deliverAndLog(opts: {
  kind: MessageKind;
  channel: Channel;
  trip_id: string | null;
  subject: string | null;
  message: string;
  recipients: OutgoingRecipient[];
  resent_from?: string | null;
}): Promise<{ success: boolean; error?: string; results: SendResult[]; log_ids: string[] }> {
  const { kind, channel, trip_id, subject, message, recipients, resent_from = null } = opts;

  let results: SendResult[] = [];
  let transportError: string | null = null;
  try {
    const res = await fetch(`${MAIL_PROJECT_URL}/functions/v1/send-message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        channel,
        subject: subject ?? undefined,
        message,
        recipients: recipients.map((r) => ({ name: r.name, email: r.email, phone: r.phone })),
      }),
      signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
    });
    let data: { success?: boolean; error?: string; results?: SendResult[] } = {};
    try {
      data = await res.json();
    } catch {
      transportError = `Oväntat svar från mejl/SMS-tjänsten (HTTP ${res.status})`;
    }
    if (!transportError) {
      if (Array.isArray(data.results)) {
        results = data.results;
      } else {
        transportError = data.error || `Mejl/SMS-tjänsten svarade HTTP ${res.status} utan resultat`;
      }
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    transportError = /timeout|abort/i.test(msg)
      ? `Mejl/SMS-tjänsten svarade inte inom ${SEND_TIMEOUT_MS / 1000} s`
      : `Kunde inte nå mejl/SMS-tjänsten (projektet kan vara pausat): ${msg}`;
  }

  const log_ids: string[] = [];
  for (let i = 0; i < recipients.length; i++) {
    const r = recipients[i];
    const result = transportError ? undefined : results[i];
    const { status, error } = transportError
      ? { status: "failed" as MessageStatus, error: transportError }
      : statusFromResult(result);
    const rows = await sql`
      INSERT INTO message_log (kind, channel, trip_id, registration_id, recipient_name, recipient_email, recipient_phone, subject, message, status, email_ok, sms_ok, error, resent_from)
      VALUES (${kind}, ${channel}, ${trip_id}, ${r.registration_id ?? null}, ${r.name ?? ""}, ${r.email ?? null}, ${r.phone ?? null}, ${subject}, ${message}, ${status}, ${result?.email ?? null}, ${result?.sms ?? null}, ${error}, ${resent_from})
      RETURNING id`;
    log_ids.push(rows[0].id);
  }

  if (transportError) {
    // Samma form som ett vanligt svar så klienten kan visa fel per mottagare.
    results = recipients.map((r) => ({ recipient: r.name, errors: [transportError!] }));
    return { success: false, error: transportError, results, log_ids };
  }
  const success = results.length > 0 && results.every((r) => r.errors.length === 0);
  return { success, results, log_ids };
}

function cleanRecipients(raw: unknown): OutgoingRecipient[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((r) => ({
      name: String((r as OutgoingRecipient).name ?? "").trim(),
      email: (r as OutgoingRecipient).email ? String((r as OutgoingRecipient).email).trim() : undefined,
      phone: (r as OutgoingRecipient).phone ? String((r as OutgoingRecipient).phone).trim() : undefined,
      registration_id: (r as OutgoingRecipient).registration_id ? String((r as OutgoingRecipient).registration_id) : undefined,
    }))
    .filter((r) => r.email || r.phone || r.name);
}

// Actions som är öppna för allmänheten (läsa publicerat innehåll + skapa anmälan).
const PUBLIC_ACTIONS = new Set([
  "trips.listPublished",
  "trips.get",
  "trips.counts",
  "pageContent.get",
  "registrations.create",
  // Gruppanmälan (huvudbokare + medresenärer) görs av kunder utan inloggning.
  "registrations.createMany",
  // Capability-länk: en registrant läser/kompletterar SIN egen anmälan via dess UUID.
  "registrations.getOne",
  "registrations.updateOwn",
  // Bekräftelsemejlet efter anmälan — går alltid till anmälans egen e-postadress.
  "messages.sendRegistration",
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
  await schemaReady;

  // Admin-gate för allt som inte är publikt.
  if (!PUBLIC_ACTIONS.has(action)) {
    const gate = await requireAdmin(req);
    if (!gate.ok) {
      // Loggas så nekade anrop går att granska i efterhand (syns i funktionsloggarna).
      console.warn("data-api access denied", { action, status: gate.res.status });
      return gate.res;
    }
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
              payment_info=${t.payment_info ? JSON.stringify(t.payment_info) : null},
              info_files=${t.info_files ? JSON.stringify(t.info_files) : null}
            WHERE id=${t.id} RETURNING *`;
          return json(rows[0]);
        }
        const rows = await sql`
          INSERT INTO trips (title, description, destination, category, start_date, end_date, price, currency, max_participants, show_spots_left, spots_left_threshold, image_url, image_position, status, form_fields, presentation_fields, additional_dates, promo_codes, payment_info, info_files)
          VALUES (${t.title}, ${t.description}, ${t.destination}, ${t.category}, ${t.start_date}, ${t.end_date}, ${t.price}, ${t.currency}, ${t.max_participants}, ${t.show_spots_left}, ${t.spots_left_threshold ?? null}, ${t.image_url}, ${t.image_position ?? null}, ${t.status}, ${JSON.stringify(t.form_fields)}, ${JSON.stringify(t.presentation_fields)}, ${t.additional_dates ? JSON.stringify(t.additional_dates) : null}, ${t.promo_codes ? JSON.stringify(t.promo_codes) : null}, ${t.payment_info ? JSON.stringify(t.payment_info) : null}, ${t.info_files ? JSON.stringify(t.info_files) : null})
          RETURNING *`;
        return json(rows[0]);
      }

      case "trips.duplicate": {
        const src = (await sql`SELECT * FROM trips WHERE id = ${p.id as string}`)[0];
        if (!src) return json({ error: "Trip not found" }, 404);
        const rows = await sql`
          INSERT INTO trips (title, description, destination, category, start_date, end_date, price, currency, max_participants, show_spots_left, spots_left_threshold, image_url, image_position, status, form_fields, presentation_fields, additional_dates, promo_codes, payment_info, info_files)
          VALUES (${`${src.title} (kopia)`}, ${src.description}, ${src.destination}, ${src.category}, ${src.start_date}, ${src.end_date}, ${src.price}, ${src.currency}, ${src.max_participants}, ${src.show_spots_left}, ${src.spots_left_threshold ?? null}, ${src.image_url}, ${src.image_position ?? null}, ${"draft"}, ${JSON.stringify(src.form_fields)}, ${JSON.stringify(src.presentation_fields)}, ${src.additional_dates ? JSON.stringify(src.additional_dates) : null}, ${src.promo_codes ? JSON.stringify(src.promo_codes) : null}, ${src.payment_info ? JSON.stringify(src.payment_info) : null}, ${src.info_files ? JSON.stringify(src.info_files) : null})
          RETURNING *`;
        return json(rows[0]);
      }

      case "trips.delete":
        await sql`DELETE FROM trips WHERE id = ${p.id as string}`;
        return json({ ok: true });

      // ---------- TRIP FILES (info-PDF:er i Supabase Storage) ----------
      case "tripFiles.upload": {
        const filename = String(p.filename ?? "");
        const content_base64 = String(p.content_base64 ?? "");
        if (!filename || !content_base64) return json({ error: "filename och content_base64 krävs" }, 400);
        if (!/\.pdf$/i.test(filename)) return json({ error: "Endast PDF-filer stöds" }, 400);
        // ~10 MB fil = ~14 MB base64
        if (content_base64.length > 14_000_000) return json({ error: "Filen är för stor (max 10 MB)" }, 413);

        const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
        // Skapa bucketen om den inte finns (idempotent — felet ignoreras om den redan finns).
        await admin.storage.createBucket("trip-files", { public: true }).catch(() => {});

        const bytes = Uint8Array.from(atob(content_base64), (c) => c.charCodeAt(0));
        const safe = filename.replace(/[^a-zA-Z0-9åäöÅÄÖ._-]+/g, "-");
        const path = `${Date.now()}-${safe}`;
        const { error: upErr } = await admin.storage
          .from("trip-files")
          .upload(path, new Blob([bytes], { type: "application/pdf" }), { contentType: "application/pdf" });
        if (upErr) return json({ error: `Uppladdningen misslyckades: ${upErr.message}` }, 500);

        const { data: pub } = admin.storage.from("trip-files").getPublicUrl(path);
        return json({ path, url: pub.publicUrl });
      }

      case "tripFiles.delete": {
        const path = String(p.path ?? "");
        if (!path) return json({ error: "path krävs" }, 400);
        const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
        const { error: rmErr } = await admin.storage.from("trip-files").remove([path]);
        if (rmErr) return json({ error: rmErr.message }, 500);
        return json({ ok: true });
      }

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

      // ---------- MEDDELANDEN (mejl/SMS + utskickslogg) ----------
      case "messages.send": {
        const channel = p.channel as Channel;
        if (!CHANNELS.includes(channel)) return json({ error: "Ogiltig kanal" }, 400);
        const kind = (KINDS.includes(p.kind as MessageKind) ? p.kind : "admin") as MessageKind;
        const message = String(p.message ?? "").trim();
        if (!message) return json({ error: "Meddelandet är tomt" }, 400);
        const recipients = cleanRecipients(p.recipients);
        if (recipients.length === 0) return json({ error: "Inga mottagare" }, 400);
        if (recipients.length > MAX_RECIPIENTS) return json({ error: `Max ${MAX_RECIPIENTS} mottagare per utskick` }, 400);
        const subject = p.subject ? String(p.subject) : null;
        const trip_id = p.trip_id ? String(p.trip_id) : null;
        return json(await deliverAndLog({ kind, channel, trip_id, subject, message, recipients }));
      }

      // PUBLIK: bekräftelsemejl efter anmälan. Mottagaren är alltid anmälans egen
      // e-post — texten byggs i klienten (den kan prisreglerna), men vem den går
      // till bestäms här.
      case "messages.sendRegistration": {
        const registration_id = String(p.registration_id ?? "");
        const message = String(p.message ?? "").trim();
        if (!registration_id || !message) return json({ error: "registration_id och message krävs" }, 400);
        const regs = await sql`SELECT id, trip_id, form_data FROM registrations WHERE id = ${registration_id}`;
        const reg = regs[0];
        if (!reg) return json({ error: "Anmälan hittades inte" }, 404);
        const fd = (typeof reg.form_data === "string" ? JSON.parse(reg.form_data) : reg.form_data) as Record<string, unknown>;
        const email = String(fd["E-post"] ?? "").trim();
        const name = `${fd["Förnamn"] ?? ""} ${fd["Efternamn"] ?? ""}`.trim();
        if (!email) return json({ success: false, error: "Anmälan saknar e-postadress", results: [], log_ids: [] });
        return json(await deliverAndLog({
          kind: "registration",
          channel: "email",
          trip_id: reg.trip_id,
          subject: p.subject ? String(p.subject) : null,
          message,
          recipients: [{ name, email, registration_id }],
        }));
      }

      case "messages.list": {
        const limit = Math.min(Math.max(Number(p.limit) || 200, 1), 1000);
        const trip_id = p.trip_id ? String(p.trip_id) : null;
        const registration_id = p.registration_id ? String(p.registration_id) : null;
        return json(await sql`
          SELECT * FROM message_log
          WHERE (${trip_id}::uuid IS NULL OR trip_id = ${trip_id}::uuid)
            AND (${registration_id}::uuid IS NULL OR registration_id = ${registration_id}::uuid)
          ORDER BY created_at DESC
          LIMIT ${limit}`);
      }

      // Skickar om en loggad rad — samma text, samma mottagare — och loggar det nya försöket.
      case "messages.resend": {
        const id = String(p.id ?? "");
        if (!id) return json({ error: "id krävs" }, 400);
        const rows = await sql`SELECT * FROM message_log WHERE id = ${id}`;
        const row = rows[0];
        if (!row) return json({ error: "Utskicket hittades inte" }, 404);
        const out = await deliverAndLog({
          kind: row.kind as MessageKind,
          channel: row.channel as Channel,
          trip_id: row.trip_id ?? null,
          subject: row.subject ?? null,
          message: row.message,
          recipients: [{
            name: row.recipient_name ?? "",
            email: row.recipient_email ?? undefined,
            phone: row.recipient_phone ?? undefined,
            registration_id: row.registration_id ?? undefined,
          }],
          resent_from: id,
        });
        const created = out.log_ids[0]
          ? (await sql`SELECT * FROM message_log WHERE id = ${out.log_ids[0]}`)[0]
          : null;
        return json({ ...out, row: created });
      }

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
