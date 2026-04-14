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

interface RegistrationEmailParams {
  firstName: string;
  tripTitle: string;
  deposit?: number;
  totalPrice?: number;
  extraCosts?: Record<string, number>;
  swish?: { number: string; name: string };
  vivaUrl?: string;
  paymentNote?: string;
}

export function buildRegistrationEmail(params: RegistrationEmailParams): { subject: string; message: string } {
  const { firstName, tripTitle, deposit, totalPrice, extraCosts, swish, vivaUrl, paymentNote } = params;
  const hasDeposit = deposit && deposit > 0;
  const otherCurrencies = Object.entries(extraCosts || {}).filter(([k, v]) => k !== 'SEK' && v > 0);
  const sekExtra = extraCosts?.['SEK'] || 0;
  const totalSek = (totalPrice || 0) + sekExtra;

  let priceStr = `${totalSek.toLocaleString('sv-SE')} SEK`;
  if (otherCurrencies.length > 0) {
    priceStr += otherCurrencies.map(([cur, amount]) => ` + ${amount.toLocaleString('sv-SE')} ${cur}`).join('');
  }

  let message = `Hej ${firstName}!\n\nVi har tagit emot din anmälan till ${tripTitle}.\n\nDitt pris: ${priceStr}\n\n`;

  if (hasDeposit) {
    message += `OBS: Din anmälan är inte bekräftad ännu. För att säkra din plats behöver du betala en deposition på ${deposit.toLocaleString('sv-SE')} SEK.\n\n`;

    if (swish) {
      message += `Swish: ${swish.number}\nMottagare: ${swish.name}\nBelopp: ${deposit.toLocaleString('sv-SE')} SEK\n\n`;
    }

    if (vivaUrl) {
      message += `Betala med kort: ${vivaUrl}\n\n`;
    }

    if (totalSek > deposit) {
      message += `Resterande belopp (${(totalSek - deposit).toLocaleString('sv-SE')} SEK) betalas senare.\n\n`;
    }

    message += `Vi bekräftar din bokning när depositionen är mottagen.`;
  } else {
    message += `Vi återkommer med betalningsinformation och bekräftelse.`;
  }

  if (paymentNote) {
    message += `\n\n${paymentNote}`;
  }

  message += `\n\nVarma hälsningar,\nWilleWorldWide`;

  return {
    subject: hasDeposit
      ? `Anmälan mottagen — betala deposition för ${tripTitle}`
      : `Anmälan mottagen — ${tripTitle}`,
    message,
  };
}
