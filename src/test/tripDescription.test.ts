import { describe, it, expect } from 'vitest';
import { parseBlocks, Block } from '@/components/trips/TripDescription';
import { serializeBlocks } from '@/components/admin/DescriptionEditor';

describe('parseBlocks', () => {
  it('formaterar beskrivning med radbrytningar till rubriker, listor och stycken', () => {
    const text = [
      'Bussresa till Bratislava – Mjällby AIF i Champions League-kval 9–12 augusti 2026. Pris: 4 850 kr',
      'I resan ingår',
      '* Bussresa tur och retur i en riktigt fin dubbeldäckare med hög komfort',
      '* Bro-, färje- och vägavgifter',
      '* Frukost på tisdagen',
      'Tillkommer',
      '* Turistskatt: 3,5 euro/natt/person',
      '* Enkelrumstillägg: 550 kr/person',
      'Häng med till Bratislava och stötta laget!',
    ].join('\n');

    const blocks = parseBlocks(text);

    expect(blocks).toEqual([
      { type: 'paragraph', text: 'Bussresa till Bratislava – Mjällby AIF i Champions League-kval 9–12 augusti 2026. Pris: 4 850 kr' },
      { type: 'heading', text: 'I resan ingår' },
      { type: 'list', items: [
        'Bussresa tur och retur i en riktigt fin dubbeldäckare med hög komfort',
        'Bro-, färje- och vägavgifter',
        'Frukost på tisdagen',
      ] },
      { type: 'heading', text: 'Tillkommer' },
      { type: 'list', items: [
        'Turistskatt: 3,5 euro/natt/person',
        'Enkelrumstillägg: 550 kr/person',
      ] },
      { type: 'paragraph', text: 'Häng med till Bratislava och stötta laget!' },
    ]);
  });

  it('hanterar äldre beskrivningar utan radbrytningar där * används som avdelare', () => {
    const text = 'I resan ingår * Bussresa tur och retur * Frukost på tisdagen';

    expect(parseBlocks(text)).toEqual([
      { type: 'heading', text: 'I resan ingår' },
      { type: 'list', items: ['Bussresa tur och retur', 'Frukost på tisdagen'] },
    ]);
  });

  it('lämnar vanlig text utan liststruktur som ett stycke', () => {
    const text = 'Följ med oss till italienska Dolomiterna! 8 skiddagar med buss från Kalmar via E22.';

    expect(parseBlocks(text)).toEqual([{ type: 'paragraph', text }]);
  });

  it('tolkar "## " som explicit rubrik även utan efterföljande lista', () => {
    const text = '## Bra att veta\nTa med giltigt pass under hela resan.';

    expect(parseBlocks(text)).toEqual([
      { type: 'heading', text: 'Bra att veta' },
      { type: 'paragraph', text: 'Ta med giltigt pass under hela resan.' },
    ]);
  });

  it('stödjer även - och • som listmarkörer', () => {
    const text = 'Ingår\n- Bussresa\n• Frukost';

    expect(parseBlocks(text)).toEqual([
      { type: 'heading', text: 'Ingår' },
      { type: 'list', items: ['Bussresa', 'Frukost'] },
    ]);
  });
});

describe('serializeBlocks', () => {
  it('rundresa: block → text → samma block', () => {
    const blocks: Block[] = [
      { type: 'paragraph', text: 'Bussresa till Bratislava 9–12 augusti 2026.' },
      { type: 'heading', text: 'I resan ingår' },
      { type: 'list', items: ['Bussresa tur och retur', 'Frukost på tisdagen'] },
      { type: 'heading', text: 'Bra att veta' },
      { type: 'paragraph', text: 'Ta med giltigt pass.' },
    ];

    expect(parseBlocks(serializeBlocks(blocks))).toEqual(blocks);
  });

  it('hoppar över tomma block och tomma punkter', () => {
    const blocks: Block[] = [
      { type: 'heading', text: '  ' },
      { type: 'list', items: ['Bussresa', '', '  '] },
      { type: 'paragraph', text: '' },
    ];

    expect(serializeBlocks(blocks)).toBe('* Bussresa');
  });
});
