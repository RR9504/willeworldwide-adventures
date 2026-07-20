import { Navigate } from 'react-router-dom';
import PublicHeader from '@/components/layout/PublicHeader';
import PublicFooter from '@/components/layout/PublicFooter';
import PageHero from '@/components/layout/PageHero';
import ContactCTA from '@/components/layout/ContactCTA';
import { getOffering } from '@/data/siteContent';
import { usePageContent } from '@/hooks/usePageContent';

interface OfferingPageProps {
  slug: string;
}

const OfferingPage = ({ slug }: OfferingPageProps) => {
  const offering = getOffering(slug);
  const { t } = usePageContent(slug);
  if (!offering) return <Navigate to="/" replace />;

  const paras = (key: string) => t(key).split(/\n\n+/).map((s) => s.trim()).filter(Boolean);

  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />
      <PageHero title={t('title')} subtitle={t('subtitle')} gradient={offering.gradient} />

      <main className="flex-1">
        <div className="container max-w-3xl py-14">
          <div className="space-y-4">
            {paras('intro').map((p, i) => (
              <p key={i} className="text-lg leading-relaxed text-foreground">
                {p}
              </p>
            ))}
          </div>

          {offering.sections.map((_, i) => {
            const heading = t(`s${i}_heading`);
            const body = paras(`s${i}_body`);
            if (!heading && body.length === 0) return null;
            return (
              <div key={i} className="mt-12">
                {heading && <h2 className="mb-4 text-2xl font-bold tracking-tight">{heading}</h2>}
                <div className="space-y-4">
                  {body.map((p, j) => (
                    <p key={j} className="leading-relaxed text-muted-foreground">
                      {p}
                    </p>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <ContactCTA
        heading={`Redo för ${offering.navLabel.toLowerCase()}?`}
        bookingLink="/#resor"
        bookingLabel={t('cta')}
      />
      <PublicFooter />
    </div>
  );
};

export default OfferingPage;
