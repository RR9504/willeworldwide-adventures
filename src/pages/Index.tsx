import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { Search, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import PublicHeader from '@/components/layout/PublicHeader';
import PublicFooter from '@/components/layout/PublicFooter';
import ContactCTA from '@/components/layout/ContactCTA';
import Logo from '@/components/layout/Logo';
import TripCard from '@/components/trips/TripCard';
import { usePublishedTrips, useTripRegistrationCounts } from '@/hooks/useTrips';
import { usePageContent } from '@/hooks/usePageContent';
import { offerings } from '@/data/siteContent';
import { TripCategory } from '@/types/trip';

const categories: { value: TripCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'Alla resor' },
  { value: 'ski', label: 'Skidresor' },
  { value: 'group', label: 'Gruppresor' },
  { value: 'corporate', label: 'Företag' },
];

const Index = () => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<TripCategory | 'all'>('all');
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const el = document.querySelector(location.hash);
      if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 50);
    }
  }, [location]);

  const { data: publishedTrips = [], isLoading } = usePublishedTrips();
  const { data: regCounts = {} } = useTripRegistrationCounts();
  const { t } = usePageContent('hem');
  const filtered = publishedTrips.filter((trip) => {
    const matchesSearch =
      trip.title.toLowerCase().includes(search.toLowerCase()) ||
      trip.destination.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === 'all' || trip.category === category;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />

      {/* Hero */}
      <section className="relative overflow-hidden bg-sidebar py-24 md:py-32">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-25"
          style={{
            backgroundImage:
              'url(https://images.unsplash.com/photo-1551524559-8af4e6624178?w=1600&q=80)',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-sidebar/95 via-sidebar/80 to-sidebar/50" />
        <div className="container relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-2xl"
          >
            <Logo className="mb-8 h-14 md:h-20" />
            <p className="text-lg italic leading-relaxed text-sidebar-foreground/80 md:text-xl">
              {t('hero_tagline')}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <a href="#resor">Se våra resor</a>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-sidebar-foreground/30 bg-transparent text-sidebar-foreground hover:bg-sidebar-foreground/10 hover:text-sidebar-foreground">
                <Link to="/kontakt">Boka möte</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Erbjudanden */}
      <section className="border-b bg-background py-16">
        <div className="container">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">{t('erbjudanden_heading')}</h2>
          <p className="mt-2 text-muted-foreground">{t('erbjudanden_sub')}</p>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {offerings.map((o) => (
              <Link
                key={o.slug}
                to={`/${o.slug}`}
                className="group flex flex-col rounded-xl border bg-card p-6 transition-colors hover:border-primary"
              >
                <h3 className="text-lg font-semibold">{o.navLabel}</h3>
                <p className="mt-2 flex-1 text-sm text-muted-foreground">{o.subtitle}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
                  Läs mer <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Filter & sök */}
      <section id="resor" className="border-b bg-card py-6">
        <div className="container flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <Badge
                key={c.value}
                variant={category === c.value ? 'default' : 'outline'}
                className="cursor-pointer px-4 py-1.5 text-sm transition-colors"
                onClick={() => setCategory(c.value)}
              >
                {c.label}
              </Badge>
            ))}
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Sök destination eller resa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </section>

      {/* Resor */}
      <main className="container flex-1 py-10">
        {isLoading ? (
          <div className="py-20 text-center text-muted-foreground">
            <p className="text-lg">Laddar resor…</p>
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((trip) => (
              <TripCard key={trip.id} trip={trip} registrationCount={regCounts[trip.id] ?? 0} />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center text-muted-foreground">
            <p className="text-lg">Inga resor publicerade just nu – hör av dig så berättar vi om kommande avgångar!</p>
          </div>
        )}
      </main>

      {/* Om oss-teaser */}
      <section className="border-t bg-background py-16">
        <div className="container grid items-center gap-8 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">{t('omoss_heading')}</h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">{t('omoss_text')}</p>
            <Button asChild variant="outline" className="mt-6">
              <Link to="/om-oss">Läs mer om oss</Link>
            </Button>
          </div>
          <div className="rounded-xl border bg-card p-8">
            <p className="text-lg italic leading-relaxed text-muted-foreground">"{t('omoss_quote')}"</p>
            <p className="mt-4 font-semibold">William Arrhenius Leandersson</p>
          </div>
        </div>
      </section>

      <ContactCTA />
      <PublicFooter />
    </div>
  );
};

export default Index;
