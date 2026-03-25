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
      { id: 'tf-6', type: 'select', label: 'Kontaktväg', required: true, options: [
        { label: 'Facebook-grupp', value: 'facebook' },
        { label: 'SMS', value: 'sms' },
        { label: 'Mail', value: 'mail' },
      ]},
      { id: 'tf-7', type: 'select', label: 'Påstigningsplats', required: true, options: [
        { label: 'Kalmar', value: 'kalmar' },
        { label: 'Karlskrona', value: 'karlskrona' },
        { label: 'Kristianstad', value: 'kristianstad' },
        { label: 'Lund', value: 'lund' },
        { label: 'Hyllie (Malmö)', value: 'hyllie' },
      ]},
      { id: 'tf-8', type: 'select', label: 'Hotell', required: true, options: [
        { label: 'Hotell 1', value: 'hotell-1' },
        { label: 'Hotell 2', value: 'hotell-2' },
      ]},
      { id: 'tf-9', type: 'select', label: 'Rumstyp', required: true, options: [
        { label: 'Enkelrum', value: 'single' },
        { label: 'Dubbelrum', value: 'double' },
        { label: '3-bäddsrum', value: 'triple' },
        { label: '4-bäddsrum', value: 'quad' },
      ]},
      { id: 'tf-10', type: 'text', label: 'Rumskompis', required: false, placeholder: 'Namn på person du vill dela rum med' },
      { id: 'tf-11', type: 'checkbox', label: 'Liftkort', required: false, conditionalFields: [
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
      { id: 'tf-12', type: 'checkbox', label: 'Skidhyra', required: false, conditionalFields: [
        { type: 'select', label: 'Typ av utrustning', required: true, options: [
          { label: 'Slalom', value: 'alpine' },
          { label: 'Snowboard', value: 'snowboard' },
        ]},
        { type: 'select', label: 'Storlek skor', required: true, options: [
          { label: '36', value: '36' }, { label: '37', value: '37' },
          { label: '38', value: '38' }, { label: '39', value: '39' },
          { label: '40', value: '40' }, { label: '41', value: '41' },
          { label: '42', value: '42' }, { label: '43', value: '43' },
          { label: '44', value: '44' }, { label: '45', value: '45' },
          { label: '46', value: '46' },
        ]},
      ]},
      { id: 'tf-13', type: 'textarea', label: 'Allergier / specialkost', required: false, placeholder: 'Ange eventuella allergier eller kostpreferenser' },
      { id: 'tf-14', type: 'text', label: 'Favoritchoklad', required: false, placeholder: 'Vilken är din favoritchoklad?' },
      { id: 'tf-15', type: 'checkbox', label: 'Buffé (ditresan)', required: false },
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
      { id: 'tf-6', type: 'select', label: 'Kontaktväg', required: true, options: [
        { label: 'Facebook-grupp', value: 'facebook' },
        { label: 'SMS', value: 'sms' },
        { label: 'Mail', value: 'mail' },
      ]},
      { id: 'tf-7', type: 'select', label: 'Påstigningsplats', required: true, options: [
        { label: 'Kalmar', value: 'kalmar' },
        { label: 'Karlskrona', value: 'karlskrona' },
        { label: 'Kristianstad', value: 'kristianstad' },
        { label: 'Lund', value: 'lund' },
        { label: 'Hyllie (Malmö)', value: 'hyllie' },
      ]},
      { id: 'tf-8', type: 'select', label: 'Rumstyp', required: true, options: [
        { label: 'Enkelrum', value: 'single' },
        { label: 'Dubbelrum', value: 'double' },
      ]},
      { id: 'tf-9', type: 'text', label: 'Rumskompis', required: false, placeholder: 'Namn på person du vill dela rum med' },
      { id: 'tf-10', type: 'textarea', label: 'Allergier / specialkost', required: false, placeholder: 'Ange eventuella allergier eller kostpreferenser' },
      { id: 'tf-11', type: 'text', label: 'Favoritchoklad', required: false, placeholder: 'Vilken är din favoritchoklad?' },
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
