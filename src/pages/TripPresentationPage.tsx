import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Header from '@/components/layout/Header';
import { mockTrips, mockRegistrations } from '@/data/mockTrips';

const TripPresentationPage = () => {
  const { id } = useParams<{ id: string }>();
  const trip = mockTrips.find(t => t.id === id);
  const registrations = mockRegistrations.filter(r => r.trip_id === id);
  const withPresentation = registrations.filter(r => r.presentation_data && Object.keys(r.presentation_data).length > 0);

  if (!trip) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <div className="container flex flex-1 items-center justify-center">
          <p>Resan hittades inte</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <Header />
      <main className="container flex-1 py-8">
        {/* Screen-only controls */}
        <div className="mb-6 flex items-center justify-between print:hidden">
          <Link to={`/dashboard/resor/${trip.id}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Tillbaka till {trip.title}
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {withPresentation.length} av {registrations.length} har svarat
            </span>
            <Button onClick={() => window.print()} className="gap-2">
              <Printer className="h-4 w-4" /> Skriv ut
            </Button>
          </div>
        </div>

        {/* Print header */}
        <div className="mb-8 text-center">
          <h1 className="font-heading text-3xl font-bold">{trip.title}</h1>
          <p className="mt-1 text-lg text-muted-foreground">{trip.destination} · {new Date(trip.start_date).toLocaleDateString('sv-SE', { day: 'numeric', month: 'long' })} – {new Date(trip.end_date).toLocaleDateString('sv-SE', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          <p className="mt-2 text-sm text-muted-foreground">Lär känna dina medresenärer!</p>
        </div>

        {/* Participant cards */}
        <div className="grid gap-6 sm:grid-cols-2 print:grid-cols-2 print:gap-4">
          {withPresentation.map(reg => {
            const name = `${reg.form_data['Förnamn'] || ''} ${reg.form_data['Efternamn'] || ''}`.trim();
            const city = reg.presentation_data?.['Varifrån kommer du?'];
            const age = reg.presentation_data?.['Hur gammal är du?'];
            const job = reg.presentation_data?.['Vad jobbar du med?'];
            const subtitle = [age ? `${age} år` : '', city, job].filter(Boolean).join(' · ');

            return (
              <Card key={reg.id} className="break-inside-avoid print:shadow-none print:border">
                <CardContent className="p-5">
                  <div className="mb-3">
                    <h3 className="font-heading text-lg font-bold">{name}</h3>
                    {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
                  </div>
                  <div className="space-y-2">
                    {trip.presentation_fields
                      .filter(pf => {
                        const answer = reg.presentation_data?.[pf.question];
                        // Skip the fields already shown in the header
                        if (['Varifrån kommer du?', 'Hur gammal är du?', 'Vad jobbar du med?'].includes(pf.question)) return false;
                        return answer && answer.trim() !== '';
                      })
                      .map(pf => (
                        <div key={pf.id}>
                          <p className="text-xs font-semibold text-muted-foreground">{pf.question}</p>
                          <p className="text-sm">{reg.presentation_data?.[pf.question]}</p>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {withPresentation.length === 0 && (
          <div className="py-20 text-center text-muted-foreground">
            <p className="text-lg">Inga deltagare har fyllt i presentationsformuläret ännu.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default TripPresentationPage;
