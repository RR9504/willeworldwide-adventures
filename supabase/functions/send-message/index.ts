import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Recipient {
  name: string;
  email?: string;
  phone?: string;
}

interface SendRequest {
  channel: "email" | "sms" | "both";
  recipients: Recipient[];
  subject?: string;
  message: string;
  from_email?: string;
  from_name?: string;
}

async function sendSMS(to: string, message: string): Promise<{ ok: boolean; error?: string }> {
  const username = Deno.env.get("ELKS_USERNAME")!;
  const password = Deno.env.get("ELKS_PASSWORD")!;

  const res = await fetch("https://api.46elks.com/a1/sms", {
    method: "POST",
    headers: {
      Authorization: "Basic " + btoa(`${username}:${password}`),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      from: "WOW",
      to,
      message,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    return { ok: false, error: text };
  }
  return { ok: true };
}

async function sendEmail(
  to: string,
  toName: string,
  subject: string,
  html: string,
  fromEmail: string,
  fromName: string,
): Promise<{ ok: boolean; error?: string }> {
  const apiKey = Deno.env.get("RESEND_API_KEY")!;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `${fromName} <${fromEmail}>`,
      to: [`${toName} <${to}>`],
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    return { ok: false, error: text };
  }
  return { ok: true };
}

function formatPhone(phone: string): string {
  // Behåll bara siffror + ett ev. inledande plus — kunden kan ha skrivit
  // "070-123 45 67", "(070) 1234567" eller "+46 70 123 45 67".
  const hasPlus = phone.trim().startsWith("+");
  let digits = phone.replace(/\D/g, "");

  // 0046… är landskod, inte ett svenskt nummer som börjar på 0.
  if (!hasPlus && digits.startsWith("00")) {
    return "+" + digits.slice(2);
  }
  if (hasPlus) {
    return "+" + digits;
  }
  // Nationellt format: ledande 0 byts mot landskoden.
  if (digits.startsWith("0")) {
    digits = "46" + digits.slice(1);
  }
  return "+" + digits;
}

function personalizeMessage(message: string, recipient: Recipient): string {
  return message
    .replace(/\{förnamn\}/gi, recipient.name.split(" ")[0] || "")
    .replace(/\{namn\}/gi, recipient.name || "");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body: SendRequest = await req.json();
    const { channel, recipients, subject, message, from_email, from_name } = body;

    const fromAddr = from_email || "hej@willeworldwide.se";
    const fromN = from_name || "Wille Worldwide";

    const results: { recipient: string; sms?: boolean; email?: boolean; errors: string[] }[] = [];

    for (const recipient of recipients) {
      const personalizedMsg = personalizeMessage(message, recipient);
      const entry: typeof results[number] = { recipient: recipient.name, errors: [] };

      // Send SMS
      if ((channel === "sms" || channel === "both") && recipient.phone) {
        const phone = formatPhone(recipient.phone);
        const smsResult = await sendSMS(phone, personalizedMsg);
        entry.sms = smsResult.ok;
        if (!smsResult.ok) entry.errors.push(`SMS: ${smsResult.error}`);
      }

      // Send Email
      if ((channel === "email" || channel === "both") && recipient.email) {
        const htmlBody = personalizedMsg.replace(/\n/g, "<br>");
        const emailResult = await sendEmail(
          recipient.email,
          recipient.name,
          subject || "Meddelande från Wille Worldwide",
          htmlBody,
          fromAddr,
          fromN,
        );
        entry.email = emailResult.ok;
        if (!emailResult.ok) entry.errors.push(`Email: ${emailResult.error}`);
      }

      results.push(entry);
    }

    const allOk = results.every((r) => r.errors.length === 0);

    return new Response(
      JSON.stringify({ success: allOk, results }),
      {
        status: allOk ? 200 : 207,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: String(err) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
