import { Navigate } from 'react-router-dom';
import PublicHeader from '@/components/layout/PublicHeader';
import PublicFooter from '@/components/layout/PublicFooter';
import PageHero from '@/components/layout/PageHero';
import ContactCTA from '@/components/layout/ContactCTA';
import { getOffering } from '@/data/siteContent';

interface OfferingPageProps {
  slug: string;
}

const OfferingPage = ({ slug }: OfferingPageProps) => {
  const offering = getOffering(slug);
  if (!offering) return <Navigate to="/" replace />;

  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />
      <PageHero title={offering.title} subtitle={offering.subtitle} gradient={offering.gradient} />

      <main className="flex-1">
        <div className="container max-w-3xl py-14">
          <p className="text-lg leading-relaxed text-foreground">{offering.intro}</p>

          {offering.sections.map((section, i) => (
            <div key={i} className="mt-12">
              {section.heading && (
                <h2 className="mb-4 text-2xl font-bold tracking-tight">{section.heading}</h2>
              )}
              <div className="space-y-4">
                {section.body.map((para, j) => (
                  <p key={j} className="leading-relaxed text-muted-foreground">
                    {para}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>

      <ContactCTA
        heading={`Redo för ${offering.navLabel.toLowerCase()}?`}
        bookingLink="/#resor"
        bookingLabel={offering.ctaLabel}
      />
      <PublicFooter />
    </div>
  );
};

export default OfferingPage;
