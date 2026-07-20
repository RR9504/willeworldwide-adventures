import PublicHeader from '@/components/layout/PublicHeader';
import PublicFooter from '@/components/layout/PublicFooter';
import PageHero from '@/components/layout/PageHero';
import ContactCTA from '@/components/layout/ContactCTA';

const OmOss = () => (
  <div className="flex min-h-screen flex-col">
    <PublicHeader />
    <PageHero
      title="Om oss"
      subtitle="Din personliga reserådgivare som nyfiket lyssnar på dina drömresor och passionerat inspirerar dig med tips och idéer på äventyr runt om i hela världen."
      gradient="from-slate-900 via-indigo-950 to-slate-800"
    />

    <main className="flex-1">
      <div className="container max-w-3xl py-14">
        <p className="text-lg leading-relaxed text-foreground">
          Välkommen till Wille Worldwide! Vi kan hjälpa dig med de flesta typer av resor och är
          specialister på skidresor samt gruppresor med buss och flyg – både för privatpersoner och
          företag.
        </p>

        <div className="mt-12">
          <h2 className="mb-4 text-2xl font-bold tracking-tight">William Arrhenius Leandersson</h2>
          <div className="space-y-4 text-muted-foreground">
            <p className="leading-relaxed">
              Jag brinner för att hjälpa till med planering och logistik, ge rådgivning om lämpligt
              resmål och skapa förutsättningar för just dig att bygga fina reseminnen – vare sig det
              är med flyg, buss eller bil. Att resa innebär att komma bort från vardagen, slappna av,
              förverkliga drömmar, möta andra kulturer och stärka relationer.
            </p>
            <p className="leading-relaxed">
              Jag har ett genuint intresse och passion för resande och har besökt de flesta länderna
              i Europa. Jag har även rest en hel del i både Asien och USA. Jag gillar variationen och
              vill uppleva resandet med alla fem sinnen. När jag reser föredrar jag en tidig löprunda
              precis i soluppgången när alla ligger och sover – tid att reflektera över livet och
              känna tacksamhet för det jag har.
            </p>
            <p className="leading-relaxed">
              Jag har en gedigen geografikunskap och god lokalkännedom om många städer och länder i
              Europa. Jag har rest med familj, i större grupper och på egen hand, så jag har bra koll
              på hur man ska tänka beroende på resetyp och resesällskap.
            </p>
          </div>
        </div>

        <div className="mt-12 rounded-xl border bg-card p-8">
          <h2 className="mb-4 text-2xl font-bold tracking-tight">Vår filosofi</h2>
          <div className="space-y-4 text-muted-foreground">
            <p className="leading-relaxed">
              Vi vill alltid våra kunders bästa, där vårt viktigaste mål är att må bra genom att
              hjälpa andra. Om huvudsyftet är att hjälpa människor kommer du också att lyckas – för
              då blir det genuint och äkta.
            </p>
            <p className="leading-relaxed">
              Allt vi gör ska göras från hjärtat – ett hjärta och en passion för det vi jobbar med,
              och för att kunden ska få en så bra upplevelse som möjligt. Vi håller en hög servicenivå
              där vi gör det lilla extra, och där målsättningen är att kunden blir stamkund. Vi ser
              hellre våra kunder som våra vänner.
            </p>
          </div>
        </div>
      </div>
    </main>

    <ContactCTA />
    <PublicFooter />
  </div>
);

export default OmOss;
