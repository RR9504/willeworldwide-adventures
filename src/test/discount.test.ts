import { describe, it, expect } from 'vitest';
import {
  calcExtraCostsFromFormData,
  parseSignedPriceInLabel,
  stripPriceFromLabel,
  formatCurrencyDelta,
  buildOrderConfirmationEmail,
  withOptionValues,
  findOptionForValue,
  summarizeSendErrors,
} from '@/lib/messaging';
import { FormField } from '@/types/trip';

// Wille's barnrabattfält: rabatten ligger i prisrutan (priceModifier), inte i texten.
const barnrabatt: FormField = {
  id: 'f-barn',
  type: 'select',
  label: 'Barnrabatt',
  required: false,
  options: [
    { label: '<6 år (I tre, eller fyrbäddsrum med vuxen)', value: 'under-6', priceModifier: -4500, priceModifierCurrency: 'SEK' },
    { label: '9-12 år (I tre, eller fyrbäddsrum med vuxen)', value: '9-12', priceModifier: -1100, priceModifierCurrency: 'SEK' },
  ],
};

describe('barnrabatt (negativ prismodifierare)', () => {
  it('dras av från slutpriset', () => {
    expect(calcExtraCostsFromFormData([barnrabatt], { Barnrabatt: '9-12' })).toEqual({ SEK: -1100 });
    expect(calcExtraCostsFromFormData([barnrabatt], { Barnrabatt: 'under-6' })).toEqual({ SEK: -4500 });
  });

  it('kvittas mot tillägg i samma valuta', () => {
    const enkelrum: FormField = {
      id: 'f-rum', type: 'select', label: 'Rumstyp', required: true,
      options: [{ label: 'Enkelrum', value: 'single', priceModifier: 1900, priceModifierCurrency: 'SEK' }],
    };
    expect(calcExtraCostsFromFormData([barnrabatt, enkelrum], { Barnrabatt: '9-12', Rumstyp: 'single' }))
      .toEqual({ SEK: 800 });
  });

  it('syns i bekräftelsemejlets totalpris', () => {
    const { message } = buildOrderConfirmationEmail('Anna', 'Skidresa', {
      totalPrice: 11600,
      extraCosts: { SEK: -1100 },
      isFullyPaid: true,
    });
    // 11 600 − 1 100 = 10 500
    expect(message).toContain('Skidresa');
    const { message: medDeposition } = buildOrderConfirmationEmail('Anna', 'Skidresa', {
      totalPrice: 11600,
      extraCosts: { SEK: -1100 },
      deposit: 2000,
    });
    // sv-SE använder hårt mellanslag som tusentalsavgränsare — bygg förväntan på samma sätt.
    const sek = (n: number) => n.toLocaleString('sv-SE');
    expect(medDeposition).toContain(`Ditt totalpris: ${sek(10500)} SEK`);
    expect(medDeposition).toContain(`Resterande belopp (${sek(8500)} SEK)`);
  });

  it('räknas inte in när priset bara står i etiketten', () => {
    const bara_text: FormField = {
      ...barnrabatt,
      options: [{ label: '9-12 år (I tre, eller fyrbäddsrum med vuxen) -1100 SEK', value: '9-12', priceModifierCurrency: 'SEK' }],
    };
    expect(calcExtraCostsFromFormData([bara_text], { Barnrabatt: '9-12' })).toEqual({});
  });
});

describe('parseSignedPriceInLabel', () => {
  it('hittar pris med uttryckligt tecken', () => {
    expect(parseSignedPriceInLabel('9-12 år (I tre, eller fyrbäddsrum med vuxen) -1100 SEK'))
      .toMatchObject({ amount: -1100, currency: 'SEK' });
    expect(parseSignedPriceInLabel('Enkelrum (+1 900 kr)')).toMatchObject({ amount: 1900, currency: 'SEK' });
    expect(parseSignedPriceInLabel('Tältbiljett +40 EUR')).toMatchObject({ amount: 40, currency: 'EUR' });
    expect(parseSignedPriceInLabel('Rabatt −500 kr')).toMatchObject({ amount: -500, currency: 'SEK' });
  });

  it('gissar inte på belopp utan tecken — kan vara alternativets totalpris', () => {
    expect(parseSignedPriceInLabel('Cavalletto (11 600 kr)')).toBeNull();
    expect(parseSignedPriceInLabel('Val de Costa (11 900 kr)')).toBeNull();
  });

  it('förväxlar inte åldersspann och rumstyper med priser', () => {
    expect(parseSignedPriceInLabel('9-12 år (I tre, eller fyrbäddsrum med vuxen)')).toBeNull();
    expect(parseSignedPriceInLabel('3-bäddsrum')).toBeNull();
    expect(parseSignedPriceInLabel('Dubbelrum')).toBeNull();
    expect(parseSignedPriceInLabel('')).toBeNull();
  });
});

describe('stripPriceFromLabel', () => {
  it('plockar bort priset ur etiketten', () => {
    expect(stripPriceFromLabel('9-12 år (I tre, eller fyrbäddsrum med vuxen) -1100 SEK'))
      .toBe('9-12 år (I tre, eller fyrbäddsrum med vuxen)');
    expect(stripPriceFromLabel('Enkelrum (+1 900 kr)')).toBe('Enkelrum');
  });

  it('lämnar etiketter utan pris orörda', () => {
    expect(stripPriceFromLabel('Cavalletto (11 600 kr)')).toBe('Cavalletto (11 600 kr)');
    expect(stripPriceFromLabel('Dubbelrum')).toBe('Dubbelrum');
  });
});

// Priset lagras aldrig på anmälan — det räknas om från resans nuvarande fält. Att fylla i
// prisrutan i efterhand ska därför slå igenom på dem som redan anmält sig.
describe('rättad prisruta slår igenom på redan anmälda', () => {
  // Så här såg fältet ut när anmälan gjordes: priset i texten, prisrutan tom.
  const sparadAnmalan = { Barnrabatt: '9-12-år-i-tre-eller-fyrbäddsrum-med-vuxen-1100-sek' };

  it('rabatten räknas när prisrutan fylls i utan att etiketten rörs', () => {
    const efter: FormField[] = [{
      id: 'f', type: 'select', label: 'Barnrabatt', required: false,
      options: [{
        label: '9-12 år (I tre, eller fyrbäddsrum med vuxen) -1100 SEK',
        value: '9-12-år-i-tre-eller-fyrbäddsrum-med-vuxen-1100-sek',
        priceModifier: -1100, priceModifierCurrency: 'SEK',
      }],
    }];
    expect(calcExtraCostsFromFormData(efter, sparadAnmalan)).toEqual({ SEK: -1100 });
  });

  it('rabatten räknas även när priset flyttats ut ur etiketten', () => {
    // "Använd -1100 SEK" städar etiketten men behåller värdet — anmälan hittar hem.
    const efter: FormField[] = [{
      id: 'f', type: 'select', label: 'Barnrabatt', required: false,
      options: [{
        label: '9-12 år (I tre, eller fyrbäddsrum med vuxen)',
        value: '9-12-år-i-tre-eller-fyrbäddsrum-med-vuxen-1100-sek',
        priceModifier: -1100, priceModifierCurrency: 'SEK',
      }],
    }];
    expect(calcExtraCostsFromFormData(efter, sparadAnmalan)).toEqual({ SEK: -1100 });
  });

  it('hittar hem även om värdet skrevs om när etiketten kortades', () => {
    // Anmälningar gjorda innan värdet låstes pekar på den gamla, längre sluggen.
    const efter: FormField[] = [{
      id: 'f', type: 'select', label: 'Barnrabatt', required: false,
      options: [{
        label: '9-12 år (I tre, eller fyrbäddsrum med vuxen)',
        value: '9-12-år-i-tre-eller-fyrbäddsrum-med-vuxen',
        priceModifier: -1100, priceModifierCurrency: 'SEK',
      }],
    }];
    expect(calcExtraCostsFromFormData(efter, sparadAnmalan)).toEqual({ SEK: -1100 });
  });
});

describe('findOptionForValue', () => {
  const options = [
    { label: 'Enkelrum', value: 'enkelrum', priceModifier: 1900 },
    { label: 'Dubbelrum', value: 'dubbelrum' },
  ];

  it('matchar på värde, etikett och slug', () => {
    expect(findOptionForValue(options, 'enkelrum')?.label).toBe('Enkelrum');
    expect(findOptionForValue(options, 'Dubbelrum')?.label).toBe('Dubbelrum');
    expect(findOptionForValue([{ label: 'Val de Costa', value: 'vdc' }], 'val-de-costa')?.label).toBe('Val de Costa');
  });

  it('matchar bara bortkapat pris, inte bortkapade ord', () => {
    const rum = [
      { label: 'Enkelrum', value: 'enkelrum' },
      { label: 'Enkelrum med balkong', value: 'enkelrum-med-balkong' },
    ];
    // "Enkelrum med utsikt" är ett eget alternativ — inte "Enkelrum" med något avklippt.
    expect(findOptionForValue(rum, 'enkelrum-med-utsikt')).toBeUndefined();
    // Men "enkelrum-1-900-kr" är just "Enkelrum" från när priset stod i etiketten.
    expect(findOptionForValue(rum, 'enkelrum-1-900-kr')?.label).toBe('Enkelrum');
  });

  it('returnerar undefined för tomt och okänt', () => {
    expect(findOptionForValue(options, '')).toBeUndefined();
    expect(findOptionForValue(options, undefined)).toBeUndefined();
    expect(findOptionForValue(options, 'trebäddsrum')).toBeUndefined();
    expect(findOptionForValue(undefined, 'enkelrum')).toBeUndefined();
  });
});

describe('withOptionValues', () => {
  it('fyller i värde för alternativ som saknar det', () => {
    const fields: FormField[] = [{
      id: 'f', type: 'select', label: 'Rumstyp', required: true,
      options: [{ label: 'Enkelrum', value: '' }, { label: 'Dubbelrum', value: '' }],
    }];
    expect(withOptionValues(fields)[0].options?.map(o => o.value)).toEqual(['enkelrum', 'dubbelrum']);
  });

  it('rör inte värden som redan finns — sparade anmälningar pekar på dem', () => {
    const fields: FormField[] = [{
      id: 'f', type: 'select', label: 'Barnrabatt', required: false,
      options: [{ label: '9-12 år', value: '9-12-år-i-tre-eller-fyrbäddsrum-med-vuxen-1100-sek', priceModifier: -1100 }],
    }];
    expect(withOptionValues(fields)[0].options?.[0].value).toBe('9-12-år-i-tre-eller-fyrbäddsrum-med-vuxen-1100-sek');
  });

  it('täcker även villkorade underfält', () => {
    const fields: FormField[] = [{
      id: 'f', type: 'checkbox', label: 'Skidhyra', required: false,
      conditionalFields: [{ type: 'select', label: 'Storlek', options: [{ label: 'Small', value: '' }] }],
    }];
    expect(withOptionValues(fields)[0].conditionalFields?.[0].options?.[0].value).toBe('small');
  });
});

describe('summarizeSendErrors', () => {
  it('namnger vilka mottagare som inte nåddes', () => {
    expect(summarizeSendErrors([
      { recipient: 'Lova Jonsén', errors: ['SMS: ogiltigt nummer'] },
      { recipient: 'Emma Jonsén', errors: [], email: true },
    ])).toBe('Lova Jonsén (SMS: ogiltigt nummer)');
  });

  it('kortar ner långa listor', () => {
    const many = ['A', 'B', 'C', 'D', 'E'].map(n => ({ recipient: n, errors: ['fel'] }));
    expect(summarizeSendErrors(many)).toBe('A (fel), B (fel), C (fel) och 2 till');
  });

  it('ger tom sträng när allt gick bra', () => {
    expect(summarizeSendErrors([{ recipient: 'A', errors: [], email: true }])).toBe('');
    expect(summarizeSendErrors([])).toBe('');
    expect(summarizeSendErrors(undefined)).toBe('');
  });
});

describe('formatCurrencyDelta', () => {
  it('visar tecken åt rätt håll', () => {
    expect(formatCurrencyDelta(40, 'EUR')).toBe('+ 40 EUR');
    expect(formatCurrencyDelta(-500, 'EUR')).toBe('− 500 EUR');
  });
});
