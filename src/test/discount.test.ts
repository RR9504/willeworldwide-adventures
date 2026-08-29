import { describe, it, expect } from 'vitest';
import {
  calcExtraCostsFromFormData,
  parseSignedPriceInLabel,
  stripPriceFromLabel,
  formatCurrencyDelta,
  buildOrderConfirmationEmail,
  withOptionValues,
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

describe('formatCurrencyDelta', () => {
  it('visar tecken åt rätt håll', () => {
    expect(formatCurrencyDelta(40, 'EUR')).toBe('+ 40 EUR');
    expect(formatCurrencyDelta(-500, 'EUR')).toBe('− 500 EUR');
  });
});
