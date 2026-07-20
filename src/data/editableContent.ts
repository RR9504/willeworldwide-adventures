// Registret över redigerbara sidor och deras textfält (med standardtexter).
// Wille kan redigera dessa i admin → Innehåll. Publika sidor läser via usePageContent.
import { offerings } from './siteContent';

export interface ContentField {
  key: string;
  label: string;
  multiline?: boolean;
  /** Standardtext (visas om inget sparats i databasen). */
  default: string;
  help?: string;
}

export interface EditablePage {
  slug: string; // används som nyckel i page_content-tabellen
  name: string; // visas i admin-listan
  path: string; // publik URL (för "visa sida"-länk)
  fields: ContentField[];
}

const BODY_HELP = 'Separera stycken med en tom rad.';

// Erbjudande-sidorna genereras från siteContent så vi slipper dubbla texter.
const offeringPages: EditablePage[] = offerings.map((o) => ({
  slug: o.slug,
  name: o.navLabel,
  path: `/${o.slug}`,
  fields: [
    { key: 'title', label: 'Rubrik', default: o.title },
    { key: 'subtitle', label: 'Underrubrik', multiline: true, default: o.subtitle },
    { key: 'intro', label: 'Introtext', multiline: true, default: o.intro, help: BODY_HELP },
    ...o.sections.flatMap((s, i) => [
      { key: `s${i}_heading`, label: `Sektion ${i + 1} – rubrik`, default: s.heading ?? '' },
      {
        key: `s${i}_body`,
        label: `Sektion ${i + 1} – text`,
        multiline: true,
        default: s.body.join('\n\n'),
        help: BODY_HELP,
      },
    ]),
    { key: 'cta', label: 'Text på boka-knappen', default: o.ctaLabel },
  ],
}));

const staticPages: EditablePage[] = [
  {
    slug: 'hem',
    name: 'Startsida',
    path: '/',
    fields: [
      {
        key: 'hero_tagline',
        label: 'Hero – tagline',
        multiline: true,
        default:
          'Din personliga resebyrå för gruppresor – med specialitet på skidresor med buss. Anmäl dig enkelt och säkert till våra unika reseupplevelser.',
      },
      { key: 'erbjudanden_heading', label: 'Erbjudanden – rubrik', default: 'Våra erbjudanden' },
      {
        key: 'erbjudanden_sub',
        label: 'Erbjudanden – underrubrik',
        multiline: true,
        default: 'Vi hjälper dig med de flesta typer av resor – specialister på skidresor och gruppresor.',
      },
      { key: 'omoss_heading', label: 'Om oss-teaser – rubrik', default: 'Om Wille Worldwide' },
      {
        key: 'omoss_text',
        label: 'Om oss-teaser – text',
        multiline: true,
        default:
          'Din personliga reserådgivare som nyfiket lyssnar på dina drömresor och passionerat inspirerar dig med tips och idéer på äventyr runt om i hela världen. Vi skapar reseminnen tillsammans, blir som en stor familj och träffar vänner för livet.',
      },
      {
        key: 'omoss_quote',
        label: 'Om oss-teaser – citat',
        multiline: true,
        default:
          'Allt vi gör ska göras från hjärtat – en hög servicenivå där vi gör det lilla extra och ser våra kunder mer som våra vänner.',
      },
    ],
  },
  {
    slug: 'om-oss',
    name: 'Om oss',
    path: '/om-oss',
    fields: [
      {
        key: 'subtitle',
        label: 'Hero – underrubrik',
        multiline: true,
        default:
          'Din personliga reserådgivare som nyfiket lyssnar på dina drömresor och passionerat inspirerar dig med tips och idéer på äventyr runt om i hela världen.',
      },
      {
        key: 'intro',
        label: 'Introtext',
        multiline: true,
        default:
          'Välkommen till Wille Worldwide! Vi kan hjälpa dig med de flesta typer av resor och är specialister på skidresor samt gruppresor med buss och flyg – både för privatpersoner och företag.',
      },
      { key: 'founder_heading', label: 'Grundare – rubrik', default: 'William Arrhenius Leandersson' },
      {
        key: 'founder_body',
        label: 'Grundare – text',
        multiline: true,
        help: BODY_HELP,
        default:
          'Jag brinner för att hjälpa till med planering och logistik, ge rådgivning om lämpligt resmål och skapa förutsättningar för just dig att bygga fina reseminnen – vare sig det är med flyg, buss eller bil. Att resa innebär att komma bort från vardagen, slappna av, förverkliga drömmar, möta andra kulturer och stärka relationer.\n\nJag har ett genuint intresse och passion för resande och har besökt de flesta länderna i Europa. Jag har även rest en hel del i både Asien och USA. Jag gillar variationen och vill uppleva resandet med alla fem sinnen. När jag reser föredrar jag en tidig löprunda precis i soluppgången när alla ligger och sover – tid att reflektera över livet och känna tacksamhet för det jag har.\n\nJag har en gedigen geografikunskap och god lokalkännedom om många städer och länder i Europa. Jag har rest med familj, i större grupper och på egen hand, så jag har bra koll på hur man ska tänka beroende på resetyp och resesällskap.',
      },
      { key: 'philosophy_heading', label: 'Filosofi – rubrik', default: 'Vår filosofi' },
      {
        key: 'philosophy_body',
        label: 'Filosofi – text',
        multiline: true,
        help: BODY_HELP,
        default:
          'Vi vill alltid våra kunders bästa, där vårt viktigaste mål är att må bra genom att hjälpa andra. Om huvudsyftet är att hjälpa människor kommer du också att lyckas – för då blir det genuint och äkta.\n\nAllt vi gör ska göras från hjärtat – ett hjärta och en passion för det vi jobbar med, och för att kunden ska få en så bra upplevelse som möjligt. Vi håller en hög servicenivå där vi gör det lilla extra, och där målsättningen är att kunden blir stamkund. Vi ser hellre våra kunder som våra vänner.',
      },
    ],
  },
  {
    slug: 'kontakt',
    name: 'Kontakt',
    path: '/kontakt',
    fields: [
      {
        key: 'subtitle',
        label: 'Hero – underrubrik',
        multiline: true,
        default:
          'Vi gillar att träffa och prata med våra kunder. Boka ett telefonmöte, ett fysiskt möte – eller ett hembesök i vårt rullande kontor.',
      },
      { key: 'office_heading', label: 'Rullande kontoret – rubrik', default: 'Det rullande kontoret' },
      {
        key: 'office_text',
        label: 'Rullande kontoret – text',
        multiline: true,
        default:
          'Vi erbjuder ett unikt sätt att träffas på: boka ett hembesök där mötet hålls vid tomtgränsen utanför ditt hem, i vårt rullande kontor – vår nyrenoverade van. Där sitter vi i lugn och ro och planerar din framtida resa, och du slipper köra iväg. Hembesök kan göras inom en radie om 4 mil från Sölvesborgs kommun. Vi utgår från Hällevik i Blekinge.',
      },
      {
        key: 'response_text',
        label: 'Svarslöfte',
        multiline: true,
        default:
          'Kan vi inte svara direkt ringer vi upp eller kontaktar dig på annat sätt samma dag eller dagen därpå. Inför ett möte eller i samband med bokning ser vi gärna att du fyller i vårt reseformulär, så att vi kan anpassa reseupplägget så individuellt som möjligt.',
      },
    ],
  },
];

export const editablePages: EditablePage[] = [...staticPages, ...offeringPages];

export const getEditablePage = (slug: string): EditablePage | undefined =>
  editablePages.find((p) => p.slug === slug);

/** Standardtext för ett fält (fallback när inget sparats). */
export const getFieldDefault = (slug: string, key: string): string => {
  const field = getEditablePage(slug)?.fields.find((f) => f.key === key);
  return field?.default ?? '';
};
