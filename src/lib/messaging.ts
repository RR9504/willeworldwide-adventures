// Mejl/SMS (send-message) och AI-sammanfattning (ai-summary) ligger på ETT ANNAT
// Supabase-projekt än data-api — konto robin.ruuska@live.se, gratisplan. Projektet
// pausas efter ~7 dagars inaktivitet och då slutar all mejl- och SMS-utskick att
// fungera, tyst, eftersom anmälningsmejlen skickas fire-and-forget.
// .github/workflows/keepalive.yml pingar projektet för att hålla det vaket.
const EDGE_FUNCTIONS_URL = 'https://seprpsyzqmppsnmzptyo.supabase.co';

export interface SummaryAnswer {
  question: string;
  answer: string;
}

export async function generateAiSummary(params: { name: string; tripTitle?: string; answers: SummaryAnswer[] }): Promise<{ success: boolean; summary?: string; error?: string }> {
  try {
    const res = await fetch(`${EDGE_FUNCTIONS_URL}/functions/v1/ai-summary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (res.status === 404) {
      return { success: false, error: 'Edge function "ai-summary" är inte deployad till Supabase än.' };
    }
    let data: { success?: boolean; summary?: string; error?: string } = {};
    try {
      data = await res.json();
    } catch {
      return { success: false, error: `Oväntat svar från servern (HTTP ${res.status}).` };
    }
    if (!res.ok || data.success === false || !data.summary) {
      return { success: false, error: data.error || `HTTP ${res.status}` };
    }
    return { success: true, summary: data.summary };
  } catch (err) {
    // CORS-preflight 404 från Supabase ser ut som "Failed to fetch" i webbläsaren — sannolikt att funktionen saknas.
    const msg = err instanceof Error ? err.message : String(err);
    if (/failed to fetch|networkerror|load failed/i.test(msg)) {
      return { success: false, error: 'Kunde inte nå AI-tjänsten — kontrollera att edge function "ai-summary" är deployad och att Supabase-projektet är aktivt.' };
    }
    return { success: false, error: `Kunde inte nå AI-tjänsten: ${msg}` };
  }
}

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
  try {
    const res = await fetch(`${EDGE_FUNCTIONS_URL}/functions/v1/send-message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    let data: { success?: boolean; error?: string } = {};
    try {
      data = await res.json();
    } catch {
      return { success: false, error: `Oväntat svar från servern (HTTP ${res.status}).` };
    }

    if (!res.ok || data.success === false) {
      return { success: false, error: data.error || `HTTP ${res.status}` };
    }
    return { success: true };
  } catch (err) {
    // Nätverksfel, DNS-fel (Supabase-projekt pausat), CORS — returnera tydligt fel istället för att kasta vidare.
    const msg = err instanceof Error ? err.message : String(err);
    if (/failed to fetch|networkerror|load failed/i.test(msg)) {
      return { success: false, error: 'Kunde inte nå mejl/SMS-tjänsten — kontrollera att Supabase-projektet är aktivt och att edge function "send-message" är deployad.' };
    }
    return { success: false, error: `Kunde inte nå mejl/SMS-tjänsten: ${msg}` };
  }
}

export function buildOrderConfirmationEmail(
  firstName: string,
  tripTitle: string,
  options?: { deposit?: number; totalPrice?: number; extraCosts?: Record<string, number>; isFullyPaid?: boolean; tbdLabels?: string[]; promoCode?: string; promoDiscount?: number },
): { subject: string; message: string } {
  const { deposit, totalPrice, extraCosts, isFullyPaid, tbdLabels, promoCode, promoDiscount } = options || {};
  const hasDeposit = deposit && deposit > 0;
  const sekExtra = extraCosts?.['SEK'] || 0;
  const discount = promoDiscount && promoDiscount > 0 ? promoDiscount : 0;
  const totalSek = Math.max(0, (totalPrice || 0) + sekExtra - discount);
  const otherCurrencies = Object.entries(extraCosts || {}).filter(([k, v]) => k !== 'SEK' && v !== 0);

  let priceStr = `${totalSek.toLocaleString('sv-SE')} SEK`;
  if (otherCurrencies.length > 0) {
    priceStr += otherCurrencies.map(([cur, amount]) => ` ${formatCurrencyDelta(amount, cur)}`).join('');
  }

  let message = `Hej ${firstName}!\n\n`;

  const hasTbd = tbdLabels && tbdLabels.length > 0;
  const tbdSuffix = hasTbd ? ` (exklusive ${tbdLabels.join(', ')})` : '';

  if (isFullyPaid) {
    message += `Tack för din betalning av ${tripTitle}. Din resa är nu helt betald och din plats är bekräftad.`;
  } else if (hasDeposit) {
    message += `Tack! Vi har mottagit din deposition på ${deposit.toLocaleString('sv-SE')} SEK för ${tripTitle}. Din plats är nu bekräftad.`;
    if (discount > 0) {
      message += `\n\nKampanjkod${promoCode ? ` ${promoCode}` : ''}: −${discount.toLocaleString('sv-SE')} SEK`;
      message += `\nDitt totalpris${tbdSuffix}: ${priceStr}`;
    } else {
      message += `\n\nDitt totalpris${tbdSuffix}: ${priceStr}`;
    }
    if (totalSek > deposit || otherCurrencies.length > 0 || hasTbd) {
      const parts: string[] = [];
      if (totalSek > deposit) parts.push(`${(totalSek - deposit).toLocaleString('sv-SE')} SEK`);
      // Bara belopp att betala listas som resterande — ett avdrag hör inte hemma där.
      otherCurrencies.forEach(([cur, amount]) => { if (amount > 0) parts.push(`${amount.toLocaleString('sv-SE')} ${cur}`); });
      const remainingStr = parts.length > 0 ? `Resterande belopp (${parts.join(' + ')})` : '';
      const tbdStr = hasTbd ? `pris för ${tbdLabels.join(', ')}` : '';
      const combined = [remainingStr, tbdStr].filter(Boolean).join(' + ');
      const tail = hasTbd ? 'tillkommer på slutfakturan. Vi återkommer med information om detta.' : 'betalas senare. Vi återkommer med information om detta.';
      message += `\n${combined} ${tail}`;
    }
  } else {
    message += `Tack för din bokning av ${tripTitle}. Vi har mottagit din betalning och din plats är nu bekräftad.`;
    if (hasTbd) {
      message += `\n\nObs: pris för ${tbdLabels.join(', ')} tillkommer på slutfakturan.`;
    }
  }

  message += `\n\nVi återkommer med mer information inför resan.\n\nVarma hälsningar,\nWille Worldwide`;

  return {
    subject: isFullyPaid ? `Betalning mottagen — ${tripTitle}` : `Bokningsbekräftelse — ${tripTitle}`,
    message,
  };
}

// Tillägg/avdrag i annan valuta än SEK, med rätt tecken: "+ 500 EUR" / "− 500 EUR".
export function formatCurrencyDelta(amount: number, currency: string): string {
  return `${amount < 0 ? '−' : '+'} ${Math.abs(amount).toLocaleString('sv-SE')} ${currency}`;
}

// Priser skrivna direkt i alternativets text — "9-12 år … -1100 SEK", "Enkelrum (+1 900 kr)".
// Sådan text är BARA text; slutpriset räknas på fältets prisruta (priceModifier). Vi känner
// igen mönstret för att kunna varna i formulärbyggaren och erbjuda att flytta över beloppet.
//
// Bara belopp med uttryckligt + eller − tolkas. "Cavalletto (11 600 kr)" kan lika gärna vara
// alternativets totalpris som ett tillägg — det ska vi inte gissa oss till.
const SIGNED_PRICE_IN_LABEL = /([+−–—-])\s*(\d[\d\s]*?)\s*(kr|sek|eur|€)(?![a-zåäö0-9])/i;

export function parseSignedPriceInLabel(
  label: string,
): { amount: number; currency: string; text: string } | null {
  const match = SIGNED_PRICE_IN_LABEL.exec(label || '');
  if (!match) return null;

  const [text, sign, digits, unit] = match;
  const amount = Number(digits.replace(/\s/g, ''));
  if (!Number.isFinite(amount) || amount === 0) return null;

  return {
    amount: sign === '+' ? amount : -amount,
    currency: /eur|€/i.test(unit) ? 'EUR' : 'SEK',
    text,
  };
}

/**
 * Slug för ett nytt alternativ. Genereras BARA en gång, när alternativet saknar värde:
 * värdet är nyckeln som sparade anmälningar pekar på, så skrivs det om när etiketten
 * ändras tappar befintliga anmälningar både sitt val och sitt pristillägg.
 */
export const slugifyOptionValue = (label: string): string =>
  label.toLowerCase().replace(/[^a-zåäö0-9]+/g, '-').replace(/-+$/, '');

/**
 * Hittar alternativet som en sparad anmälan pekar på.
 *
 * Priset på en anmälan lagras aldrig — det räknas om från resans nuvarande fält varje
 * gång det visas. Det gör att en rättad prisruta slår igenom även på redan anmälda,
 * men bara så länge anmälans sparade svar fortfarande hittar sitt alternativ.
 *
 * Äldre anmälningar kan peka på något annat än dagens värde:
 *  - etiketten själv (så sparade formuläret förr)
 *  - en slug som genererades från en etikett som sedan ändrats — t.ex.
 *    "…-med-vuxen-1100-sek" när priset flyttats ut ur etiketten
 *
 * Utan de här fallbacken tappar sådana anmälningar tyst både sitt val och sitt pris.
 * Prefixmatchningen används bara när exakt ett alternativ kan mena svaret.
 */
export function findOptionForValue(
  options: import('@/types/trip').FormFieldOption[] | undefined,
  stored: unknown,
): import('@/types/trip').FormFieldOption | undefined {
  if (!options?.length || stored === undefined || stored === null || stored === '') return undefined;
  const value = String(stored);

  const exact = options.find(o => o.value === value)
    ?? options.find(o => o.label === value)
    ?? options.find(o => slugifyOptionValue(o.label) === value);
  if (exact) return exact;

  // Etiketten har kortats för att priset flyttats till prisrutan: svaret är den nya
  // sluggen plus det gamla prisets text ("…-med-vuxen" + "-1100-sek"). Resten måste se
  // ut som ett pris — annars är det ett riktigt ord och alternativen är olika saker
  // ("enkelrum-med-utsikt" är inte "Enkelrum").
  const looksLikePrice = (rest: string) => /^\d[\d-]*(-(kr|sek|eur))?$/.test(rest);
  const shortened = options.filter(o => {
    const slug = slugifyOptionValue(o.label);
    return slug.length > 0 && value.startsWith(`${slug}-`) && looksLikePrice(value.slice(slug.length + 1));
  });
  return shortened.length === 1 ? shortened[0] : undefined;
}

/**
 * Skyddsnät inför sparning: alternativ utan värde får ett. Ett tomt värde går inte att
 * välja (Radix Select vägrar rendera det) och kan uppstå om formuläret sparas med Enter
 * direkt efter att etiketten skrivits, innan fältet hunnit lämnas.
 */
export function withOptionValues(
  fields: import('@/types/trip').FormField[],
): import('@/types/trip').FormField[] {
  const fixOptions = <T extends { options?: import('@/types/trip').FormFieldOption[] }>(item: T): T =>
    item.options?.some(o => !o.value)
      ? { ...item, options: item.options.map(o => (o.value ? o : { ...o, value: slugifyOptionValue(o.label) })) }
      : item;

  return fields.map(field => {
    const fixed = fixOptions(field);
    return fixed.conditionalFields
      ? { ...fixed, conditionalFields: fixed.conditionalFields.map(fixOptions) }
      : fixed;
  });
}

/** Etiketten utan det inbakade priset — "Enkelrum (+1 900 kr)" → "Enkelrum". */
export function stripPriceFromLabel(label: string): string {
  const parsed = parseSignedPriceInLabel(label);
  if (!parsed) return label;
  return label
    .replace(parsed.text, '')
    .replace(/\(\s*\)/g, '')   // tomma parenteser blir kvar när priset stod inuti dem
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export function calcExtraCostsFromFormData(formFields: import('@/types/trip').FormField[], formData: Record<string, any>): Record<string, number> {
  const totals: Record<string, number> = {};
  formFields.forEach(field => {
    if (field.type === 'checkbox' && formData[field.label] && field.priceModifier && !field.priceTbd) {
      const cur = field.priceModifierCurrency || 'SEK';
      totals[cur] = (totals[cur] || 0) + field.priceModifier;
    }
    if (field.type === 'select' && field.options && formData[field.label]) {
      const selected = findOptionForValue(field.options, formData[field.label]);
      if (selected?.priceModifier && !selected.priceTbd) {
        const cur = selected.priceModifierCurrency || 'SEK';
        totals[cur] = (totals[cur] || 0) + selected.priceModifier;
      }
    }
    if (formData[field.label] && field.conditionalFields) {
      field.conditionalFields.forEach(cf => {
        if (cf.options && formData[cf.label]) {
          const selected = findOptionForValue(cf.options, formData[cf.label]);
          if (selected?.priceModifier && !selected.priceTbd) {
            const cur = selected.priceModifierCurrency || 'SEK';
            totals[cur] = (totals[cur] || 0) + selected.priceModifier;
          }
        }
      });
    }
  });
  return totals;
}

// Etiketter för val där priset är markerat som "meddelas senare" — visas i form/mejl/admin.
export function collectTbdLabels(formFields: import('@/types/trip').FormField[], formData: Record<string, any>): string[] {
  const labels: string[] = [];
  formFields.forEach(field => {
    if (field.type === 'checkbox' && formData[field.label] && field.priceTbd) {
      labels.push(field.label);
    }
    if (field.type === 'select' && field.options && formData[field.label]) {
      const selected = findOptionForValue(field.options, formData[field.label]);
      if (selected?.priceTbd) labels.push(field.label);
    }
    if (formData[field.label] && field.conditionalFields) {
      field.conditionalFields.forEach(cf => {
        if (cf.options && formData[cf.label]) {
          const selected = findOptionForValue(cf.options, formData[cf.label]);
          if (selected?.priceTbd) labels.push(cf.label);
        }
      });
    }
  });
  return labels;
}

// Formaterar en deltagares formulärsvar som rader "Etikett: värde" — för bekräftelsemejlets sammanfattning.
// Hoppar över tomma fält och tomma kryssrutor. Konditionella underfält tas med när moderkryssrutan är ikryssad.
export function formatAnswersForEmail(
  formFields: import('@/types/trip').FormField[],
  formData: Record<string, any>,
): string[] {
  const lines: string[] = [];
  formFields.forEach(field => {
    const val = formData[field.label];
    if (val === undefined || val === '' || val === null) return;
    if (field.type === 'checkbox') {
      if (!val) return; // hoppa över ej ikryssade
      lines.push(`• ${field.label}: Ja`);
      field.conditionalFields?.forEach(cf => {
        const cfVal = formData[cf.label];
        if (cfVal === undefined || cfVal === '' || cfVal === null) return;
        const displayVal = findOptionForValue(cf.options, cfVal)?.label ?? String(cfVal);
        lines.push(`    – ${cf.label}: ${displayVal}`);
      });
    } else if (field.type === 'select') {
      const displayVal = findOptionForValue(field.options, val)?.label ?? String(val);
      lines.push(`• ${field.label}: ${displayVal}`);
    } else {
      lines.push(`• ${field.label}: ${val}`);
    }
  });
  return lines;
}

// Formaterar lära känna-svaren — för bekräftelsemejlets sammanfattning.
export function formatPresentationForEmail(
  presentationFields: import('@/types/trip').PresentationQuestion[],
  presentationData: Record<string, string>,
): string[] {
  return presentationFields
    .map(pf => {
      // Svaren är keyed på pf.question (matchar PresentationFormPage + ParticipantDetailPage).
      const answer = presentationData[pf.question];
      if (!answer) return null;
      return `• ${pf.question}\n  ${answer.replace(/\n/g, '\n  ')}`;
    })
    .filter((l): l is string => l !== null);
}

// Lägsta möjliga SEK-tillägg från obligatoriska enkelval (t.ex. hotell) — används för "Pris från".
// TBD-alternativ ignoreras (priset är inte känt, kan inte räknas in).
export function calcMinRequiredExtraSek(formFields: import('@/types/trip').FormField[]): number {
  return formFields.reduce((sum, field) => {
    if (field.type === 'select' && field.required && field.options?.length) {
      const sekMods = field.options
        .filter(o => !o.priceTbd && (o.priceModifierCurrency || 'SEK') === 'SEK')
        .map(o => o.priceModifier || 0);
      if (sekMods.length) sum += Math.min(...sekMods);
    }
    return sum;
  }, 0);
}

// Hittar en kampanjkod på resan som matchar den angivna koden (skiftlägesokänsligt, trimmat).
export function findPromoCode(
  promoCodes: import('@/types/trip').PromoCode[] | undefined,
  code: string | undefined,
): import('@/types/trip').PromoCode | undefined {
  if (!promoCodes?.length || !code?.trim()) return undefined;
  const norm = code.trim().toLowerCase();
  return promoCodes.find(p => p.code.trim().toLowerCase() === norm);
}

// Rabattbelopp i SEK för en given total. Procent avrundas, fast belopp kapas till totalen.
// Resultatet kan aldrig överstiga underlaget (totalen kan inte bli negativ).
export function calcPromoDiscountSek(
  totalSek: number,
  promo: import('@/types/trip').PromoCode | undefined,
): number {
  if (!promo || totalSek <= 0) return 0;
  if (promo.type === 'percent') {
    const pct = Math.max(0, Math.min(100, promo.value));
    return Math.min(totalSek, Math.round(totalSek * pct / 100));
  }
  return Math.min(totalSek, Math.max(0, promo.value));
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
  tbdLabels?: string[];
  // Kampanjkod + rabattbelopp i SEK (redan beräknat på personens total).
  promoCode?: string;
  promoDiscount?: number;
  // Sammanfattning av deltagarens svar — så kunden ser exakt vad hen angav.
  formFields?: import('@/types/trip').FormField[];
  formData?: Record<string, any>;
  presentationFields?: import('@/types/trip').PresentationQuestion[];
  presentationData?: Record<string, string>;
}

export function buildRegistrationEmail(params: RegistrationEmailParams): { subject: string; message: string } {
  const {
    firstName, tripTitle, deposit, totalPrice, extraCosts, swish, vivaUrl, paymentNote, tbdLabels,
    promoCode, promoDiscount, formFields, formData, presentationFields, presentationData,
  } = params;
  const hasDeposit = deposit && deposit > 0;
  const otherCurrencies = Object.entries(extraCosts || {}).filter(([k, v]) => k !== 'SEK' && v !== 0);
  const sekExtra = extraCosts?.['SEK'] || 0;
  const discount = promoDiscount && promoDiscount > 0 ? promoDiscount : 0;
  const totalSek = Math.max(0, (totalPrice || 0) + sekExtra - discount);

  let priceStr = `${totalSek.toLocaleString('sv-SE')} SEK`;
  if (otherCurrencies.length > 0) {
    priceStr += otherCurrencies.map(([cur, amount]) => ` ${formatCurrencyDelta(amount, cur)}`).join('');
  }

  const tbdSuffix = tbdLabels && tbdLabels.length > 0 ? ` (exklusive ${tbdLabels.join(', ')})` : '';
  let message = `Hej ${firstName}!\n\nVi har tagit emot din anmälan till ${tripTitle}.\n\n`;
  if (discount > 0) {
    message += `Kampanjkod${promoCode ? ` ${promoCode}` : ''}: −${discount.toLocaleString('sv-SE')} SEK\n`;
  }
  message += `Ditt pris${tbdSuffix}: ${priceStr}\n`;
  if (tbdLabels && tbdLabels.length > 0) {
    message += `Pris för ${tbdLabels.join(', ')} tillkommer på slutfakturan.\n`;
  }
  message += `\n`;

  if (hasDeposit) {
    message += `OBS: Din anmälan är inte bekräftad ännu. För att säkra din plats behöver du betala en deposition på ${deposit.toLocaleString('sv-SE')} SEK.\n\n`;

    if (swish) {
      message += `Swish: ${swish.number}\nMottagare: ${swish.name}\nBelopp: ${deposit.toLocaleString('sv-SE')} SEK\n\n`;
    }

    if (vivaUrl) {
      message += `Betala med kort: ${vivaUrl}\n\n`;
    }

    const hasTbd = tbdLabels && tbdLabels.length > 0;
    if (totalSek > deposit || otherCurrencies.length > 0 || hasTbd) {
      const parts: string[] = [];
      if (totalSek > deposit) parts.push(`${(totalSek - deposit).toLocaleString('sv-SE')} SEK`);
      // Bara belopp att betala listas som resterande — ett avdrag hör inte hemma där.
      otherCurrencies.forEach(([cur, amount]) => { if (amount > 0) parts.push(`${amount.toLocaleString('sv-SE')} ${cur}`); });
      const remainingStr = parts.length > 0 ? `Resterande belopp (${parts.join(' + ')})` : '';
      const tbdStr = hasTbd ? `pris för ${tbdLabels.join(', ')}` : '';
      const combined = [remainingStr, tbdStr].filter(Boolean).join(' + ');
      const tail = hasTbd ? 'tillkommer på slutfakturan' : 'betalas senare';
      message += `${combined} ${tail}.\n\n`;
    }

    message += `Vi bekräftar din bokning när depositionen är mottagen.`;
  } else {
    message += `Vi återkommer med betalningsinformation och bekräftelse.`;
  }

  if (paymentNote) {
    message += `\n\n${paymentNote}`;
  }

  // Dina svar — så kunden ser tillbaka exakt vad hen angav
  if (formFields && formData) {
    const lines = formatAnswersForEmail(formFields, formData);
    if (lines.length > 0) {
      message += `\n\n--- Dina svar ---\n${lines.join('\n')}`;
    }
  }
  if (presentationFields && presentationData) {
    const lines = formatPresentationForEmail(presentationFields, presentationData);
    if (lines.length > 0) {
      message += `\n\n--- Lära känna ---\n${lines.join('\n')}`;
    }
  }

  message += `\n\nVarma hälsningar,\nWille Worldwide`;

  return {
    subject: hasDeposit
      ? `Anmälan mottagen — betala deposition för ${tripTitle}`
      : `Anmälan mottagen — ${tripTitle}`,
    message,
  };
}
