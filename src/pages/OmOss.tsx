import PublicHeader from '@/components/layout/PublicHeader';
import PublicFooter from '@/components/layout/PublicFooter';
import PageHero from '@/components/layout/PageHero';
import ContactCTA from '@/components/layout/ContactCTA';
import { usePageContent } from '@/hooks/usePageContent';

const OmOss = () => {
  const { t } = usePageContent('om-oss');
  const paras = (key: string) => t(key).split(/\n\n+/).map((s) => s.trim()).filter(Boolean);

  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />
      <PageHero title="Om oss" subtitle={t('subtitle')} gradient="from-slate-900 via-indigo-950 to-slate-800" />

      <main className="flex-1">
        <div className="container max-w-3xl py-14">
          <p className="text-lg leading-relaxed text-foreground">{t('intro')}</p>

          <div className="mt-12">
            <h2 className="mb-4 text-2xl font-bold tracking-tight">{t('founder_heading')}</h2>
            <div className="space-y-4 text-muted-foreground">
              {paras('founder_body').map((p, i) => (
                <p key={i} className="leading-relaxed">
                  {p}
                </p>
              ))}
            </div>
          </div>

          <div className="mt-12 rounded-xl border bg-card p-8">
            <h2 className="mb-4 text-2xl font-bold tracking-tight">{t('philosophy_heading')}</h2>
            <div className="space-y-4 text-muted-foreground">
              {paras('philosophy_body').map((p, i) => (
                <p key={i} className="leading-relaxed">
                  {p}
                </p>
              ))}
            </div>
          </div>
        </div>
      </main>

      <ContactCTA />
      <PublicFooter />
    </div>
  );
};

export default OmOss;
