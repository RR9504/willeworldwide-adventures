import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import TripCard from '@/components/trips/TripCard';
import { mockTrips, mockRegistrations } from '@/data/mockTrips';
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

  const publishedTrips = mockTrips.filter(t => t.status === 'published');
  const filtered = publishedTrips.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.destination.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === 'all' || t.category === category;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      {/* Hero – matches willeworldwide.se dark aesthetic */}
      <section className="relative overflow-hidden bg-sidebar py-24 md:py-32">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1551524559-8af4e6624178?w=1600&q=80)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-sidebar/90 via-sidebar/70 to-sidebar/40" />
        <div className="container relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-2xl"
          >
            <img
              src="https://usercontent.one/wp/www.willeworldwide.se/wp-content/uploads/2021/06/short-logo-wille-worldwide-vittext-rgb.png?media=1766889486"
              alt="WilleWorldWide"
              className="mb-8 h-14 w-auto md:h-20"
            />
            <p className="text-lg italic text-sidebar-foreground/80 leading-relaxed md:text-xl">
              Din personliga resebyrå för gruppresor – med specialitet på skidresor med buss. 
              Anmäl dig enkelt och säkert till våra unika reseupplevelser.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Filter & Search */}
      <section className="border-b bg-card py-6">
        <div className="container flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            {categories.map(c => (
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
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </section>

      {/* Trip Grid */}
      <main className="container flex-1 py-10">
        {filtered.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map(trip => (
              <TripCard
                key={trip.id}
                trip={trip}
                registrationCount={mockRegistrations.filter(r => r.trip_id === trip.id).length}
              />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center text-muted-foreground">
            <p className="text-lg">Inga resor hittades.</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Index;
