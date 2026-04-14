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

export function buildOrderConfirmationEmail(
  firstName: string,
  tripTitle: string,
  options?: { deposit?: number; totalPrice?: number; extraCosts?: Record<string, number>; isFullyPaid?: boolean },
): { subject: string; message: string } {
  const { deposit, totalPrice, extraCosts, isFullyPaid } = options || {};
  const hasDeposit = deposit && deposit > 0;
  const sekExtra = extraCosts?.['SEK'] || 0;
  const totalSek = (totalPrice || 0) + sekExtra;
  const otherCurrencies = Object.entries(extraCosts || {}).filter(([k, v]) => k !== 'SEK' && v > 0);

  let priceStr = `${totalSek.toLocaleString('sv-SE')} SEK`;
  if (otherCurrencies.length > 0) {
    priceStr += otherCurrencies.map(([cur, amount]) => ` + ${amount.toLocaleString('sv-SE')} ${cur}`).join('');
  }

  let message = `Hej ${firstName}!\n\n`;

  if (isFullyPaid) {
    message += `Tack för din betalning av ${tripTitle}. Din resa är nu helt betald och din plats är bekräftad.`;
  } else if (hasDeposit) {
    message += `Tack! Vi har mottagit din deposition på ${deposit.toLocaleString('sv-SE')} SEK för ${tripTitle}. Din plats är nu bekräftad.`;
    message += `\n\nDitt totalpris: ${priceStr}`;
    if (totalSek > deposit || otherCurrencies.length > 0) {
      const parts: string[] = [];
      if (totalSek > deposit) parts.push(`${(totalSek - deposit).toLocaleString('sv-SE')} SEK`);
      otherCurrencies.forEach(([cur, amount]) => parts.push(`${amount.toLocaleString('sv-SE')} ${cur}`));
      message += `\nResterande belopp (${parts.join(' + ')}) betalas senare. Vi återkommer med information om detta.`;
    }
  } else {
    message += `Tack för din bokning av ${tripTitle}. Vi har mottagit din betalning och din plats är nu bekräftad.`;
  }

  message += `\n\nVi återkommer med mer information inför resan.\n\nVarma hälsningar,\nWilleWorldWide`;

  return {
    subject: isFullyPaid ? `Betalning mottagen — ${tripTitle}` : `Bokningsbekräftelse — ${tripTitle}`,
    message,
  };
}

export function calcExtraCostsFromFormData(formFields: import('@/types/trip').FormField[], formData: Record<string, any>): Record<string, number> {
  const totals: Record<string, number> = {};
  formFields.forEach(field => {
    if (field.type === 'checkbox' && formData[field.label] && field.priceModifier) {
      const cur = field.priceModifierCurrency || 'SEK';
      totals[cur] = (totals[cur] || 0) + field.priceModifier;
    }
    if (field.type === 'select' && field.options && formData[field.label]) {
      const selected = field.options.find(o => o.value === formData[field.label]);
      if (selected?.priceModifier) {
        const cur = selected.priceModifierCurrency || 'SEK';
        totals[cur] = (totals[cur] || 0) + selected.priceModifier;
      }
    }
    if (formData[field.label] && field.conditionalFields) {
      field.conditionalFields.forEach(cf => {
        if (cf.options && formData[cf.label]) {
          const selected = cf.options.find(o => o.value === formData[cf.label]);
          if (selected?.priceModifier) {
            const cur = selected.priceModifierCurrency || 'SEK';
            totals[cur] = (totals[cur] || 0) + selected.priceModifier;
          }
        }
      });
    }
  });
  return totals;
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

    if (totalSek > deposit || otherCurrencies.length > 0) {
      let remaining = `Resterande belopp (`;
      const parts: string[] = [];
      if (totalSek > deposit) parts.push(`${(totalSek - deposit).toLocaleString('sv-SE')} SEK`);
      otherCurrencies.forEach(([cur, amount]) => parts.push(`${amount.toLocaleString('sv-SE')} ${cur}`));
      remaining += parts.join(' + ') + `) betalas senare.\n\n`;
      message += remaining;
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
