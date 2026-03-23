import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Mountain, Snowflake } from 'lucide-react';
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

      {/* Hero */}
      <section className="relative overflow-hidden bg-sidebar py-20 md:py-28">
        <div className="absolute inset-0 opacity-10">
          {[...Array(6)].map((_, i) => (
            <Snowflake
              key={i}
              className="absolute text-white animate-pulse"
              style={{
                left: `${15 + i * 15}%`,
                top: `${10 + (i % 3) * 30}%`,
                width: `${20 + i * 5}px`,
                height: `${20 + i * 5}px`,
                animationDelay: `${i * 0.5}s`,
              }}
            />
          ))}
        </div>
        <div className="container relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <div className="mb-6 flex justify-center">
              <Mountain className="h-12 w-12 text-primary" />
            </div>
            <h1 className="font-heading text-4xl font-extrabold tracking-tight text-white md:text-5xl lg:text-6xl">
              Upplev världen med <span className="text-primary">Wille</span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-white/70">
              Skidresor, gruppresor och företagsäventyr. Anmäl dig enkelt och säkert till våra unika reseupplevelser.
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
            <Mountain className="mx-auto mb-4 h-12 w-12 opacity-30" />
            <p className="text-lg">Inga resor hittades.</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Index;
