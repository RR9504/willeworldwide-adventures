import { useParams, useSearchParams } from 'react-router-dom';
import { CalendarDays, MapPin, Users, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import DynamicForm from '@/components/trips/DynamicForm';
import { mockTrips, mockRegistrations } from '@/data/mockTrips';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const categoryLabels: Record<string, string> = {
  ski: 'Skidresa', group: 'Gruppresa', corporate: 'Företag', other: 'Övrigt',
};

const TripRegistrationPage = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const isEmbed = searchParams.get('embed') === 'true';
  const trip = mockTrips.find(t => t.id === id);

  if (!trip) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="font-heading text-2xl font-bold">Resan hittades inte</h1>
          <p className="mt-2 text-muted-foreground">Kontrollera att länken stämmer.</p>
        </div>
      </div>
    );
  }

  const regCount = mockRegistrations.filter(r => r.trip_id === trip.id).length;
  const spotsLeft = trip.max_participants - regCount;
  const startDate = new Date(trip.start_date);
  const endDate = new Date(trip.end_date);
  const dateStr = `${startDate.toLocaleDateString('sv-SE', { day: 'numeric', month: 'long' })} – ${endDate.toLocaleDateString('sv-SE', { day: 'numeric', month: 'long', year: 'numeric' })}`;

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href.replace('?embed=true', ''));
    toast.success('Länk kopierad!');
  };

  const handleSubmit = (data: Record<string, any>) => {
    console.log('Registration submitted:', data);
    toast.success('Anmälan skickad!');
  };

  return (
    <div className={`flex min-h-screen flex-col ${isEmbed ? 'bg-transparent' : 'bg-muted/30'}`}>
      {/* Hero — hidden in embed mode */}
      {!isEmbed && (
        <div className="relative h-64 overflow-hidden md:h-80">
          <img src={trip.image_url} alt={trip.title} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="container">
              <Badge className="mb-3 bg-primary text-primary-foreground">{categoryLabels[trip.category]}</Badge>
              <h1 className="font-heading text-3xl font-extrabold text-white md:text-4xl">{trip.title}</h1>
            </div>
          </div>
        </div>
      )}

      <main className={`flex-1 ${isEmbed ? 'p-4' : 'container py-8'}`}>
        {/* Embed mode: compact title */}
        {isEmbed && (
          <div className="mb-4">
            <Badge className="mb-2 bg-primary text-primary-foreground">{categoryLabels[trip.category]}</Badge>
            <h1 className="font-heading text-2xl font-bold">{trip.title}</h1>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Info sidebar */}
          <motion.div
            className="lg:col-span-1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Reseinformation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span>{trip.destination}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  <span>{dateStr}</span>
                </div>
                {trip.show_spots_left && (!trip.spots_left_threshold || spotsLeft <= trip.spots_left_threshold) && (
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-primary" />
                    <span>{spotsLeft > 0 ? `${spotsLeft} av ${trip.max_participants} platser kvar` : 'Fullbokad'}</span>
                  </div>
                )}
                <div className="rounded-lg bg-accent p-4 text-center">
                  <p className="text-sm text-muted-foreground">Pris från</p>
                  <p className="font-heading text-3xl font-bold text-foreground">{trip.price.toLocaleString('sv-SE')} <span className="text-base">{trip.currency}</span></p>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{trip.description}</p>
                {!isEmbed && (
                  <Button variant="outline" size="sm" className="w-full gap-2" onClick={handleShare}>
                    <Share2 className="h-4 w-4" /> Dela resa
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Form */}
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Anmälan</CardTitle>
              </CardHeader>
              <CardContent>
                {spotsLeft <= 0 ? (
                  <div className="py-8 text-center">
                    <p className="font-heading text-xl font-bold text-destructive">Resan är fullbokad</p>
                    <p className="mt-2 text-muted-foreground">Kontakta oss om du vill stå på väntelista.</p>
                  </div>
                ) : (
                  <DynamicForm fields={trip.form_fields} onSubmit={handleSubmit} />
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>

      {/* Minimal footer — only in standalone mode */}
      {!isEmbed && (
        <footer className="border-t py-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} WilleWorldWide
        </footer>
      )}
    </div>
  );
};

export default TripRegistrationPage;
