import { describe, it, expect } from 'vitest';
import { isValidPhone, normalizePhone, phoneDigits } from '@/lib/phone';

describe('isValidPhone', () => {
  it('godkänner svenska mobilnummer i alla vanliga skrivsätt', () => {
    [
      '070-123 45 67',
      '070-1234567',
      '0701234567',
      '070 123 45 67',
      '+46701234567',
      '+46 70 123 45 67',
      '0046 70 123 45 67',
    ].forEach(nr => expect(isValidPhone(nr), nr).toBe(true));
  });

  it('godkänner fastnätsnummer med olika långa riktnummer', () => {
    [
      '08-12 34 56',     // Stockholm
      '031-123 45 67',   // Göteborg
      '0470-123 45',     // Växjö
      '0176-123 45',
    ].forEach(nr => expect(isValidPhone(nr), nr).toBe(true));
  });

  it('godkänner utländska nummer', () => {
    ['+47 123 45 678', '+1 (555) 123-4567', '+44 20 7123 4567'].forEach(nr =>
      expect(isValidPhone(nr), nr).toBe(true),
    );
  });

  it('avvisar sådant som inte är telefonnummer', () => {
    [
      '',
      '   ',
      'ring mig',
      '070-ABC 45 67',
      '123',              // för kort
      '07012345678901234', // för långt
      '070-12+34',        // plus mitt i
    ].forEach(nr => expect(isValidPhone(nr), nr).toBe(false));
  });
});

describe('normalizePhone', () => {
  it('behåller kundens skrivsätt men trimmar', () => {
    expect(normalizePhone('  070-123 45 67  ')).toBe('070-123 45 67');
    expect(normalizePhone('070  123  45  67')).toBe('070 123 45 67');
  });

  it('skriver om 00-prefix till + så att numret inte tolkas som svenskt', () => {
    expect(normalizePhone('0046701234567')).toBe('+46701234567');
    expect(normalizePhone('0046 70 123 45 67')).toBe('+46 70 123 45 67');
  });

  it('hanterar tomt värde', () => {
    expect(normalizePhone('')).toBe('');
    expect(normalizePhone(undefined)).toBe('');
  });
});

describe('phoneDigits', () => {
  it('plockar ut bara siffrorna', () => {
    expect(phoneDigits('+46 (0)70-123 45 67')).toBe('460701234567');
  });
});
