import { FormField } from '@/types/trip';

export interface FormTemplate {
  id: string;
  name: string;
  description: string;
  fields: FormField[];
}

export const formTemplates: FormTemplate[] = [
  {
    id: 'ski',
    name: 'Skidresa',
    description: 'Komplett mall för skidresor med hotell, liftkort, skidhyra m.m.',
    fields: [
      { id: 'tf-1', type: 'text', label: 'Förnamn', required: true, placeholder: 'Ditt förnamn' },
      { id: 'tf-2', type: 'text', label: 'Efternamn', required: true, placeholder: 'Ditt efternamn' },
      { id: 'tf-3', type: 'text', label: 'Personnummer', required: true, placeholder: 'YYYYMMDD-XXXX' },
      { id: 'tf-4', type: 'phone', label: 'Telefon', required: true, placeholder: '070-123 45 67' },
      { id: 'tf-5', type: 'email', label: 'E-post', required: true, placeholder: 'din@email.se' },
      { id: 'tf-6', type: 'select', label: 'Kontaktväg', required: true, showInSummary: true, options: [
        { label: 'Facebook-grupp', value: 'facebook' },
        { label: 'SMS', value: 'sms' },
        { label: 'Mail', value: 'mail' },
      ]},
      { id: 'tf-7', type: 'select', label: 'Påstigningsplats', required: true, showInSummary: true, options: [
        { label: 'Kalmar', value: 'kalmar' },
        { label: 'Karlskrona', value: 'karlskrona' },
        { label: 'Kristianstad', value: 'kristianstad' },
        { label: 'Lund', value: 'lund' },
        { label: 'Hyllie (Malmö)', value: 'hyllie' },
      ]},
      { id: 'tf-7b', type: 'text', label: 'Annan påstigningsplats', required: false, placeholder: 'Om din ort inte finns i listan ovan' },
      { id: 'tf-8', type: 'select', label: 'Hotell', required: true, showInSummary: true, options: [
        { label: 'Hotell 1', value: 'hotell-1' },
        { label: 'Hotell 2', value: 'hotell-2' },
      ]},
      { id: 'tf-9', type: 'select', label: 'Rumstyp', required: true, showInSummary: true, options: [
        { label: 'Enkelrum', value: 'single' },
        { label: 'Dubbelrum', value: 'double' },
        { label: '3-bäddsrum', value: 'triple' },
        { label: '4-bäddsrum', value: 'quad' },
      ]},
      { id: 'tf-10', type: 'text', label: 'Rumskompis', required: false, placeholder: 'Namn på person du vill dela rum med' },
      { id: 'tf-11', type: 'checkbox', label: 'Liftkort', required: false, showInSummary: true, conditionalFields: [
        { type: 'select', label: 'Typ av liftkort', required: true, options: [
          { label: 'Vuxen', value: 'vuxen' },
          { label: 'Senior', value: 'senior' },
          { label: 'Junior', value: 'junior' },
          { label: 'Barn', value: 'barn' },
        ]},
        { type: 'select', label: 'Antal dagar', required: true, options: [
          { label: '6 dagar', value: '6' },
          { label: '7 dagar', value: '7' },
          { label: '8 dagar', value: '8' },
        ]},
      ]},
      { id: 'tf-12', type: 'checkbox', label: 'Skidhyra', required: false, showInSummary: true },
      { id: 'tf-13', type: 'textarea', label: 'Allergier / specialkost', required: false, showInSummary: true, placeholder: 'Ange eventuella allergier eller kostpreferenser' },
      { id: 'tf-14', type: 'text', label: 'Favoritchoklad', required: false, showInSummary: true, placeholder: 'Vilken är din favoritchoklad?' },
      { id: 'tf-15', type: 'checkbox', label: 'Buffé (utresa)', required: false, showInSummary: true },
      { id: 'tf-16', type: 'textarea', label: 'Övrigt', required: false, placeholder: 'Meddelande till arrangören' },
    ],
  },
  {
    id: 'group',
    name: 'Gruppresa',
    description: 'Grundmall för gruppresor med kontaktinfo, rum och påstigning.',
    fields: [
      { id: 'tf-1', type: 'text', label: 'Förnamn', required: true, placeholder: 'Ditt förnamn' },
      { id: 'tf-2', type: 'text', label: 'Efternamn', required: true, placeholder: 'Ditt efternamn' },
      { id: 'tf-3', type: 'text', label: 'Personnummer', required: true, placeholder: 'YYYYMMDD-XXXX' },
      { id: 'tf-4', type: 'phone', label: 'Telefon', required: true, placeholder: '070-123 45 67' },
      { id: 'tf-5', type: 'email', label: 'E-post', required: true, placeholder: 'din@email.se' },
      { id: 'tf-6', type: 'select', label: 'Kontaktväg', required: true, showInSummary: true, options: [
        { label: 'Facebook-grupp', value: 'facebook' },
        { label: 'SMS', value: 'sms' },
        { label: 'Mail', value: 'mail' },
      ]},
      { id: 'tf-7', type: 'select', label: 'Påstigningsplats', required: true, showInSummary: true, options: [
        { label: 'Kalmar', value: 'kalmar' },
        { label: 'Karlskrona', value: 'karlskrona' },
        { label: 'Kristianstad', value: 'kristianstad' },
        { label: 'Lund', value: 'lund' },
        { label: 'Hyllie (Malmö)', value: 'hyllie' },
      ]},
      { id: 'tf-7b', type: 'text', label: 'Annan påstigningsplats', required: false, placeholder: 'Om din ort inte finns i listan ovan' },
      { id: 'tf-8', type: 'select', label: 'Rumstyp', required: true, showInSummary: true, options: [
        { label: 'Enkelrum', value: 'single' },
        { label: 'Dubbelrum', value: 'double' },
      ]},
      { id: 'tf-9', type: 'text', label: 'Rumskompis', required: false, placeholder: 'Namn på person du vill dela rum med' },
      { id: 'tf-10', type: 'textarea', label: 'Allergier / specialkost', required: false, showInSummary: true, placeholder: 'Ange eventuella allergier eller kostpreferenser' },
      { id: 'tf-11', type: 'text', label: 'Favoritchoklad', required: false, showInSummary: true, placeholder: 'Vilken är din favoritchoklad?' },
      { id: 'tf-12', type: 'textarea', label: 'Övrigt', required: false, placeholder: 'Meddelande till arrangören' },
    ],
  },
  {
    id: 'shopping',
    name: 'Shoppingresa',
    description: 'Mall för shoppingresor till Tyskland (Calles, Bordershop).',
    fields: [
      { id: 'tf-1', type: 'text', label: 'Förnamn', required: true, placeholder: 'Ditt förnamn' },
      { id: 'tf-2', type: 'text', label: 'Efternamn', required: true, placeholder: 'Ditt efternamn' },
      { id: 'tf-3', type: 'text', label: 'Personnummer', required: true, placeholder: 'YYYYMMDD-XXXX' },
      { id: 'tf-4', type: 'phone', label: 'Telefon', required: true, placeholder: '070-123 45 67' },
      { id: 'tf-5', type: 'email', label: 'E-post', required: true, placeholder: 'din@email.se' },
      { id: 'tf-6', type: 'select', label: 'Kontaktväg', required: true, showInSummary: true, options: [
        { label: 'Facebook-grupp', value: 'facebook' },
        { label: 'SMS', value: 'sms' },
        { label: 'Mail', value: 'mail' },
      ]},
      { id: 'tf-7', type: 'select', label: 'Påstigningsplats', required: true, showInSummary: true, options: [
        { label: 'Kalmar', value: 'kalmar' },
        { label: 'Karlskrona', value: 'karlskrona' },
        { label: 'Kristianstad', value: 'kristianstad' },
        { label: 'Lund', value: 'lund' },
        { label: 'Hyllie (Malmö)', value: 'hyllie' },
      ]},
      { id: 'tf-8', type: 'text', label: 'Annan påstigningsplats', required: false, placeholder: 'Om din ort inte finns i listan ovan' },
      { id: 'tf-9', type: 'select', label: 'Shoppingdestination', required: true, showInSummary: true, options: [
        { label: 'Calles', value: 'calles' },
        { label: 'Bordershop', value: 'bordershop' },
      ]},
      { id: 'tf-10', type: 'checkbox', label: 'Har förbeställt', required: false, showInSummary: true },
      { id: 'tf-11', type: 'text', label: 'Önskemål om sittplats', required: false, placeholder: 'Namn på person du vill sitta med' },
      { id: 'tf-12', type: 'textarea', label: 'Övrigt', required: false, placeholder: 'Meddelande till arrangören' },
    ],
  },
  {
    id: 'blank',
    name: 'Tomt',
    description: 'Bara grundläggande kontaktinfo. Lägg till egna fält.',
    fields: [
      { id: 'tf-1', type: 'text', label: 'Förnamn', required: true, placeholder: 'Ditt förnamn' },
      { id: 'tf-2', type: 'text', label: 'Efternamn', required: true, placeholder: 'Ditt efternamn' },
      { id: 'tf-3', type: 'phone', label: 'Telefon', required: true, placeholder: '070-123 45 67' },
      { id: 'tf-4', type: 'email', label: 'E-post', required: true, placeholder: 'din@email.se' },
    ],
  },
];
