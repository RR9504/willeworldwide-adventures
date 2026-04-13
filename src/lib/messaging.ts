// Edge functions hosted on separate Supabase project
const EDGE_FUNCTIONS_URL = 'https://seprpsyzqmppsnmzptyo.supabase.co';

interface Recipient {
  name: string;
  email?: string;
  phone?: string;
}

interface SendMessageParams {
  channel: 'email' | 'sms' | 'both';
  recipients: Recipient[];
  subject?: string;
  message: string;
}

export async function sendMessage(params: SendMessageParams): Promise<{ success: boolean; error?: string }> {
  const res = await fetch(`${EDGE_FUNCTIONS_URL}/functions/v1/send-message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const data = await res.json();
  if (!data.success) {
    return { success: false, error: data.error || 'Något gick fel vid skickandet' };
  }
  return { success: true };
}

export function buildOrderConfirmationEmail(firstName: string, tripTitle: string): { subject: string; message: string } {
  return {
    subject: `Bokningsbekräftelse — ${tripTitle}`,
    message: `Hej ${firstName}!\n\nTack för din bokning av ${tripTitle}. Vi har mottagit din betalning och din plats är nu bekräftad.\n\nVi återkommer med mer information inför resan.\n\nVarma hälsningar,\nWilleWorldWide`,
  };
}
