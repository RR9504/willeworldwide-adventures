import { Mail, Phone, MapPin, MessageSquare, Facebook, Truck } from 'lucide-react';
import PublicHeader from '@/components/layout/PublicHeader';
import PublicFooter from '@/components/layout/PublicFooter';
import PageHero from '@/components/layout/PageHero';
import { contactInfo } from '@/data/siteContent';

const Kontakt = () => (
  <div className="flex min-h-screen flex-col">
    <PublicHeader />
    <PageHero
      title="Kontakt"
      subtitle="Vi gillar att träffa och prata med våra kunder. Boka ett telefonmöte, ett fysiskt möte – eller ett hembesök i vårt rullande kontor."
      gradient="from-slate-900 via-teal-950 to-slate-800"
    />

    <main className="flex-1">
      <div className="container max-w-4xl py-14">
        {/* Kontaktkort */}
        <div className="grid gap-5 sm:grid-cols-2">
          <a
            href={`mailto:${contactInfo.email}`}
            className="flex items-start gap-4 rounded-xl border bg-card p-6 transition-colors hover:border-primary"
          >
            <Mail className="h-6 w-6 shrink-0 text-primary" />
            <div>
              <div className="font-semibold">Mejla oss</div>
              <div className="text-sm text-muted-foreground">{contactInfo.email}</div>
            </div>
          </a>

          <div className="flex items-start gap-4 rounded-xl border bg-card p-6">
            <Phone className="h-6 w-6 shrink-0 text-primary" />
            <div>
              <div className="font-semibold">Ring eller SMS:a</div>
              {contactInfo.phones.map((p) => (
                <div key={p} className="text-sm text-muted-foreground">
                  <a href={`tel:${p.replace(/\s/g, '')}`} className="hover:text-foreground">
                    {p}
                  </a>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-start gap-4 rounded-xl border bg-card p-6">
            <MapPin className="h-6 w-6 shrink-0 text-primary" />
            <div>
              <div className="font-semibold">{contactInfo.company}</div>
              <div className="text-sm text-muted-foreground">
                {contactInfo.address}
                <br />
                {contactInfo.region}
              </div>
            </div>
          </div>

          <a
            href={contactInfo.facebook}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-4 rounded-xl border bg-card p-6 transition-colors hover:border-primary"
          >
            <Facebook className="h-6 w-6 shrink-0 text-primary" />
            <div>
              <div className="font-semibold">Facebook</div>
              <div className="text-sm text-muted-foreground">Följ oss för nyheter och avgångar</div>
            </div>
          </a>
        </div>

        {/* Det rullande kontoret */}
        <div className="mt-10 rounded-xl border bg-gradient-to-br from-slate-900 to-slate-800 p-8 text-white">
          <div className="flex items-center gap-3">
            <Truck className="h-7 w-7 text-primary" />
            <h2 className="text-2xl font-bold">Det rullande kontoret</h2>
          </div>
          <p className="mt-4 max-w-2xl leading-relaxed text-white/80">
            Vi erbjuder ett unikt sätt att träffas på: boka ett hembesök där mötet hålls vid
            tomtgränsen utanför ditt hem, i vårt rullande kontor – vår nyrenoverade van. Där sitter vi
            i lugn och ro och planerar din framtida resa, och du slipper köra iväg. Hembesök kan göras
            inom en radie om 4 mil från Sölvesborgs kommun. Vi utgår från Hällevik i Blekinge.
          </p>
        </div>

        {/* Svarslöfte */}
        <div className="mt-8 flex items-start gap-3 text-muted-foreground">
          <MessageSquare className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <p className="leading-relaxed">
            Kan vi inte svara direkt ringer vi upp eller kontaktar dig på annat sätt samma dag eller
            dagen därpå. Inför ett möte eller i samband med bokning ser vi gärna att du fyller i vårt
            reseformulär, så att vi kan anpassa reseupplägget så individuellt som möjligt.
          </p>
        </div>
      </div>
    </main>

    <PublicFooter />
  </div>
);

export default Kontakt;
