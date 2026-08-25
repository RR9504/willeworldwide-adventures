// Telefonnummer — validering och normalisering.
//
// Folk skriver sina nummer på alla möjliga sätt: "070-123 45 67", "0701234567",
// "+46 70 123 45 67", "08-12 34 56", "0470-123 45". Vi validerar därför på SIFFRORNA,
// inte på skiljetecknen. Bindestreck och mellanslag är ren kosmetik — de tvättas ändå
// bort innan numret används (se supabase/functions/send-message/formatPhone), så att
// kräva ett exakt format stoppar bara riktiga kunder utan att ge något tillbaka.

/** Alla siffror i strängen, utan skiljetecken. */
export const phoneDigits = (value: unknown): string => String(value ?? '').replace(/\D/g, '');

/** Tecken vi accepterar i ett telefonnummer: siffror, mellanslag och vanliga skiljetecken. */
const ALLOWED = /^\+?[\d\s\-()/.]+$/;

/**
 * Är det här ett rimligt telefonnummer?
 *
 * Godkänner svenska mobil- och fastnätsnummer i alla vanliga skrivsätt samt
 * internationella nummer (+46…, 0046…). Avvisar bokstäver, tomma strängar och
 * nummer som är för korta/långa för att vara riktiga (7–15 siffror, E.164:s tak).
 */
export const isValidPhone = (value: unknown): boolean => {
  const raw = String(value ?? '').trim();
  if (!raw) return false;
  if (!ALLOWED.test(raw)) return false;
  // Plus får bara stå först — "070-12+34" är inget nummer.
  if (raw.lastIndexOf('+') > 0) return false;

  const digits = phoneDigits(raw);
  // 0046… räknas som landskod, inte som siffror i själva numret.
  const significant = digits.startsWith('00') ? digits.slice(2) : digits;
  return significant.length >= 7 && significant.length <= 15;
};

/**
 * Städar ett nummer inför sparning — behåller kundens skrivsätt men trimmar
 * dubbla mellanslag och skriver om 00-prefix till + (annars blir 0046… feltolkat
 * som svenskt nummer när SMS:et ska skickas).
 */
export const normalizePhone = (value: unknown): string => {
  const raw = String(value ?? '').trim().replace(/\s+/g, ' ');
  if (!raw) return '';
  if (raw.startsWith('00')) return `+${raw.slice(2).trimStart()}`;
  return raw;
};

/** Felmeddelande + hjälptext — samma ordval överallt där nummer matas in. */
export const PHONE_ERROR = 'Kontrollera telefonnumret — det verkar inte vara ett giltigt nummer';
export const PHONE_HINT = 'T.ex. 070-123 45 67, 0701234567 eller +46 70 123 45 67';
