// Publikt webbplatsinnehåll för Wille Worldwide.
// Texterna är hämtade och lätt bearbetade från willeworldwide.se (före hacket)
// via Internet Archive. Evergreen-formulerade (inga inaktuella datum).

export interface OfferingSection {
  heading?: string;
  body: string[];
}

export interface Offering {
  slug: string;
  navLabel: string;
  title: string;
  subtitle: string;
  gradient: string; // tailwind gradient-klasser för hero
  intro: string;
  sections: OfferingSection[];
  ctaLabel: string;
}

export const contactInfo = {
  company: 'Wille Worldwide AB',
  email: 'hej@willeworldwide.se',
  phones: ['073-382 03 11', '075-195 31 25'],
  address: 'Hällevik, 294 72 Sölvesborg',
  region: 'Blekinge',
  facebook: 'https://www.facebook.com/WILLE-Worldwide-104631558506030',
  guarantor: 'eXcits Worldwide AB (556661-3773)',
};

export const offerings: Offering[] = [
  {
    slug: 'skidresor',
    navLabel: 'Skidresor',
    title: 'Skidresor till Italien & Dolomiterna',
    subtitle: 'Skidåkning i världsklass med buss och helhetslösning – från dörr till backe.',
    gradient: 'from-slate-900 via-sky-950 to-slate-800',
    intro:
      'Wille Worldwide AB erbjuder varje vintersäsong skidresor till Italien och Dolomiterna. Vi har lång erfarenhet från Alperna och en helhetslösning som är unik. Vi finns med på hela resan och tar hand om dig från avresa hela vägen tills du är hemma igen – så att du kan känna dig helt trygg.',
    sections: [
      {
        heading: 'Buss + skidåkning – praktiskt oslagbart',
        body: [
          'Med buss på plats har vi möjlighet att besöka ett stort antal områden som du inte kommer åt när du flyger ner. På så vis får du ta del av olika typer av skidsystem med varierande natur. Förutom Canazei kan du med vår buss besöka skidområden som San Pellegrino, Lusia, Cavalese och Latemar.',
          'Vi reser med fina helturistbussar av högsta klass. Förutom bussresan ingår hotell med halvpension, vilket innebär att frukost och middag serveras dagligen på hotellet. Maten på hotellet, samt maten som erbjuds i skidsystemen, är en upplevelse i sig.',
        ],
      },
      {
        heading: 'Canazei och Sella Ronda',
        body: [
          'Vi utgår från området kring Canazei och därifrån kan du på egen hand ta dig runt i olika system. Bland annat kan du åka den välkända "Sella Ronda" – en dagsutflykt runt bergskedjan på cirka 4 mil, med skidåkning för både nybörjare och mer vana åkare.',
          'Canazei ligger på 1450 m ö.h. och liftarna har öppet till 17.30, så är du fanatiker kan du verkligen maxa din skidupplevelse. Med liftkortet Superski Dolomiti når du 1200 km pist – ett av världens största system. Italien är känt för sina välpistade backar och eftersom systemen ligger högt håller sig snön mycket bra. Behöver du hyra skidutrustning hjälper vi dig givetvis med det.',
        ],
      },
      {
        heading: 'En stor familj',
        body: [
          'Vi har många stamkunder som återkommer år från år. Gillar du människor och att resa i grupp är detta resan för dig. Vi skapar minnen och reseupplevelser tillsammans, blir som en stor familj och träffar vänner för livet.',
          'Vi omfattas av resegaranti via vår samarbetspartner eXcits Worldwide AB (556661-3773), som är teknisk arrangör, så du kan känna dig helt trygg. Vi utgår från Blekinge men kan ordna transfer om du kommer längre uppifrån landet, och kan även hämta resenärer i Skåne på angivna platser.',
        ],
      },
    ],
    ctaLabel: 'Boka din skidresa',
  },
  {
    slug: 'gruppresor-foretagsresor',
    navLabel: 'Gruppresor & Företag',
    title: 'Gruppresor & Företagsresor',
    subtitle: 'Kompisgäng, konferens eller kickoff – vi ordnar helheten.',
    gradient: 'from-slate-900 via-amber-950 to-stone-800',
    intro:
      'Är ni ett kompisgäng som vill åka iväg och spela golf, titta på fotboll eller bara ha en oförglömlig weekend? Kanske vill du och ditt företag anordna en konferensresa för att svetsa samman gruppen ännu mer. Vi kan hjälpa er!',
    sections: [
      {
        heading: 'Bättre priser för grupper',
        body: [
          'Är ni över 10 personer räknas ni som en grupp vid olika typer av bokningar. När det gäller flyg, boende och evenemang har ni oftast bättre priser än om man bokar till enskilda personer. Vi har givetvis möjlighet att sätta ihop resor för färre än 10 personer också.',
          'Via vårt nära samarbete med Sölvesborgs Taxi kan vi erbjuda bussresor med chaufför till grupper och företag. Vi har egna busschaufförer inom WOW som på ett säkert och tryggt sätt tar er dit ni önskar, inom hela Europa, i moderna helturistbussar av högsta klass.',
        ],
      },
      {
        heading: 'Vi kan stå till tjänst med',
        body: [
          'Bokning av hela resan – flyg, övernattningar, utflykter och transfers.',
          'Bokning av aktiviteter och evenemang – sightseeing, kulturella arrangemang och sportevenemang.',
          'Rådgivning om visum, budget, säsonger, reseförsäkringar och avbokningsskydd.',
          'Buss och chaufför för färd inom hela Europa – då vi har avtal med flygbolag kan vi också erbjuda konkurrenskraftiga flygpriser.',
        ],
      },
      {
        heading: 'Vårt tips inför konferensen',
        body: [
          'Planera i god tid – gärna 11–13 månader i förväg – och ha en plan B ifall önskad helg inte är tillgänglig. Bestäm syftet med konferensen och anpassa den efter det för att få ut maximalt av era pengar. Gör en budget där allt ni vill ska ingå finns med, och håll er till den röda tråden.',
        ],
      },
    ],
    ctaLabel: 'Planera er gruppresa',
  },
  {
    slug: 'skraddarsydda-resor',
    navLabel: 'Skräddarsydda resor',
    title: 'Skräddarsydda resor',
    subtitle: 'Låt oss göra jobbet – en helhetslösning från dörr till dörr.',
    gradient: 'from-slate-900 via-emerald-950 to-slate-800',
    intro:
      'Om du inte vill eller orkar kan du låta oss ta hand om dina resplaner och göra jobbet åt dig. Vi ger dig ett förslag utefter dina behov och önskemål – vi skräddarsyr din resa.',
    sections: [
      {
        heading: 'Bättre pris och trygghet',
        body: [
          'Det kan kännas lockande att själv sätta ihop sin resa, men risken är stor att du i slutändan betalar för mycket och lägger ner värdefull tid. Eftersom vi har avtal med flygbolag, hotell, hyrbilsföretag och rederier får vi oftast bättre priser och en bättre överblick.',
          'När du bokar en resa via oss skyddas du av paketreselagen. Vår samarbetspartner eXcits Worldwide AB (556661-3773) är teknisk arrangör och har ställd resegaranti till Kammarkollegiet. Händer det något oförutsett – ett inställt flyg eller ett dubbelbokat hotell – ser vi utan extra kostnad till att resan blir som du tänkt dig.',
        ],
      },
      {
        heading: 'Från dörr till dörr',
        body: [
          'Vi erbjuder en helhetslösning med service från dörr till dörr. Vi hjälper dig med allt från planering, transfer, flyg, buss, boende och aktiviteter. Vi finns med dig hela vägen. Inga drömmar är för stora och vi jobbar med resor över hela världen – det är endast din fantasi som sätter gränserna.',
          'Att vara ute i god tid lönar sig oftast, då "boka tidigt"-rabatter är tillgängliga och urvalet är större. Ett bra riktmärke är att förbereda resan 9–11 månader före avresa. Tillsammans planerar vi i lugn och ro och ger råd utifrån våra egna och andra kunders erfarenheter.',
        ],
      },
    ],
    ctaLabel: 'Skräddarsy min resa',
  },
  {
    slug: 'kryssningar',
    navLabel: 'Kryssningar',
    title: 'Kryssningar till hela världen',
    subtitle: 'Avkoppling, underhållning och flera länder – på samma resa.',
    gradient: 'from-slate-900 via-cyan-950 to-slate-800',
    intro:
      'Tänk om man kunde kombinera en resa med avkoppling, underhållning, möjligheten att uppleva flera länder och besöka vackra stränder och städer med många sevärdheter. Det är precis vad en kryssning kan ge dig.',
    sections: [
      {
        heading: 'Flera destinationer, ett boende',
        body: [
          'På en kryssning packar du upp en gång och vaknar ändå upp i en ny stad. Ombord finns mat, nöjen och avkoppling – och i land väntar sevärdheter, stränder och kultur. Vi hjälper dig hitta rätt rederi, rutt och hytt utifrån vad just du vill ha ut av resan.',
          'Vi har avtal med rederier och kan ofta erbjuda bra priser och en trygg helhetslösning med transfer och kringarrangemang. Berätta vart du drömmer om att åka, så tar vi fram ett förslag.',
        ],
      },
    ],
    ctaLabel: 'Boka din kryssning',
  },
  {
    slug: 'oktoberfesten-i-bremen',
    navLabel: 'Oktoberfest Bremen',
    title: 'Oktoberfesten i Bremen – Freimarkt',
    subtitle: 'Genuin tysk festglädje – öl, musik och en oförglömlig atmosfär.',
    gradient: 'from-stone-900 via-amber-900 to-stone-800',
    intro:
      'Upplev Oktoberfesten i Bremen – Freimarkt, där tradition möter festglädje! Fira i genuin tysk anda med öl i överflöd, härlig musik och en atmosfär du sent kommer att glömma. Kom och gör Bremen Freimarkt till ditt Oktoberfestminne.',
    sections: [
      {
        heading: 'Så går resan till',
        body: [
          'Vi startar med upphämtning i Blekinge och längs E22, tar färjan Rödby–Puttgarden och gör ett kortare stopp innan vi fortsätter mot Bremen. Vi bor 3 nätter i delat dubbelrum på ett hotell endast cirka 600 meter från Freimarkt, inklusive frukost och en gemensam middag på ankomstdagen.',
          'Dagarna ägnar du åt att utforska staden – kanske ett besök i Bremens äldsta kvarter Schnoor med sina pittoreska gränder, restauranger och butiker – och kvällarna åt den fantastiska stämningen i öltälten på Bürgerweide, med tivoli, tysk mat och öl i generösa krus.',
        ],
      },
      {
        heading: 'Bra att veta',
        body: [
          'I resan ingår bussresa tur och retur, boende med frukost samt en middag. Inträde till Freimarkt, turistskatt och dryck till middagen ingår inte. Anmälan görs via mail eller telefon – hör av dig så berättar vi mer om nästa avgång.',
        ],
      },
    ],
    ctaLabel: 'Anmäl dig till Oktoberfest',
  },
];

export const getOffering = (slug: string): Offering | undefined =>
  offerings.find((o) => o.slug === slug);
