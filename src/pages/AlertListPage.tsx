import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Header from '@/components/layout/Header';
import { useTrips, useAllRegistrations } from '@/hooks/useTrips';
import { PaymentStatus } from '@/types/trip';

const paymentLabels: Record<PaymentStatus, string> = {
  unpaid: 'Ej betald', paid: 'Betald', partial: 'Delbetalad', refunded: 'Återbetald',
};
const paymentColors: Record<PaymentStatus, string> = {
  unpaid: 'bg-destructive/10 text-destructive',
  paid: 'bg-green-100 text-green-700',
  partial: 'bg-yellow-100 text-yellow-700',
  refunded: 'bg-muted text-muted-foreground',
};

type AlertType = 'unpaid' | 'missing-presentation' | 'low-spots';

const alertConfig: Record<AlertType, { title: string; description: string }> = {
  unpaid: { title: 'Inväntar betalning', description: 'Alla deltagare som ännu inte betalat sin resa.' },
  'missing-presentation': { title: 'Saknar "Lär känna"-svar', description: 'Deltagare som inte fyllt i sitt presentationsformulär.' },
  'low-spots': { title: 'Resor med få platser kvar', description: 'Publicerade resor med 10 eller färre platser kvar.' },
};

const AlertListPage = () => {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const alertType = type as AlertType;
  const config = alertConfig[alertType];
  const { data: trips = [], isLoading: tripsLoading } = useTrips();
  const { data: registrations = [], isLoading: regsLoading } = useAllRegistrations();
  const loading = tripsLoading || regsLoading;

  const grouped = useMemo(() => {
    if (alertType === 'low-spots') {
      return trips
        .filter(t => t.status === 'published')
        .map(t => {
          const regCount = registrations.filter(r => r.trip_id === t.id).length;
          const spotsLeft = t.max_participants - regCount;
          return { trip: t, spotsLeft, regCount };
        })
        .filter(x => x.spotsLeft > 0 && x.spotsLeft <= 10);
    }

    return trips.map(trip => {
      const regs = registrations.filter(r => r.trip_id === trip.id);
      const filtered = alertType === 'unpaid'
        ? regs.filter(r => r.payment_status === 'unpaid')
        : regs.filter(r => !r.presentation_data || Object.keys(r.presentation_data).length === 0);
      return { trip, regs: filtered };
    }).filter(x => x.regs.length > 0);
  }, [alertType, trips, registrations]);

  if (!config) {
    return (<div className="flex min-h-screen flex-col"><Header /><div className="container flex flex-1 items-center justify-center"><p>Okänd vytyp</p></div></div>);
  }

  if (loading) {
    return (<div className="flex min-h-screen flex-col bg-muted/30"><Header /><div className="flex flex-1 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></div>);
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <Header />
      <main className="container flex-1 py-8">
        <Link to="/dashboard" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Tillbaka till dashboard
        </Link>
        <div className="mb-6">
          <h1 className="font-heading text-2xl font-bold">{config.title}</h1>
          <p className="text-sm text-muted-foreground">{config.description}</p>
        </div>

        {alertType === 'low-spots' && (
          <div className="space-y-3">
            {(grouped as { trip: typeof trips[number]; spotsLeft: number; regCount: number }[]).map(({ trip, spotsLeft, regCount }) => (
              <Link key={trip.id} to={`/dashboard/resor/${trip.id}`} className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50">
                <div className="flex items-center gap-4">
                  {trip.image_url && <img src={trip.image_url} alt={trip.title} className="h-12 w-12 rounded-md object-cover" />}
                  <div>
                    <p className="font-heading font-semibold">{trip.title}</p>
                    <p className="text-sm text-muted-foreground">{trip.destination} · {new Date(trip.start_date).toLocaleDateString('sv-SE')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center rounded-full bg-orange-100 px-2.5 py-1 text-sm font-medium text-orange-700">{spotsLeft} platser kvar</span>
                  <span className="text-sm text-muted-foreground">{regCount}/{trip.max_participants}</span>
                </div>
              </Link>
            ))}
            {grouped.length === 0 && (<div className="py-12 text-center text-muted-foreground">Inga resor med få platser kvar just nu.</div>)}
          </div>
        )}

        {alertType !== 'low-spots' && (
          <div className="space-y-6">
            {(grouped as { trip: typeof trips[number]; regs: typeof registrations }[]).map(({ trip, regs }) => (
              <Card key={trip.id}>
                <CardHeader>
                  <div className="flex items-center gap-4">
                    {trip.image_url && <img src={trip.image_url} alt={trip.title} className="h-10 w-10 rounded-md object-cover" />}
                    <div className="flex-1">
                      <CardTitle className="text-base"><Link to={`/dashboard/resor/${trip.id}`} className="hover:underline">{trip.title}</Link></CardTitle>
                      <p className="text-sm text-muted-foreground">{trip.destination}</p>
                    </div>
                    <Badge variant="secondary">{regs.length} st</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>#</TableHead>
                          <TableHead>Namn</TableHead>
                          <TableHead>E-post</TableHead>
                          <TableHead>Telefon</TableHead>
                          {alertType === 'unpaid' && <TableHead>Betalning</TableHead>}
                          {alertType === 'missing-presentation' && <TableHead>Presentationslänk</TableHead>}
                          <TableHead>Anmäld</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {regs.map((r, i) => {
                          const name = `${r.form_data['Förnamn'] || ''} ${r.form_data['Efternamn'] || ''}`.trim();
                          return (
                            <TableRow key={r.id} className="cursor-pointer hover:bg-accent/50" onClick={() => navigate(`/dashboard/resor/${trip.id}/deltagare/${r.id}`)}>
                              <TableCell>{i + 1}</TableCell>
                              <TableCell className="font-medium">{name || '–'}</TableCell>
                              <TableCell>{r.form_data['E-post'] || '–'}</TableCell>
                              <TableCell>{r.form_data['Telefon'] || '–'}</TableCell>
                              {alertType === 'unpaid' && (
                                <TableCell><span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${paymentColors[r.payment_status]}`}>{paymentLabels[r.payment_status]}</span></TableCell>
                              )}
                              {alertType === 'missing-presentation' && (
                                <TableCell>
                                  <span className="text-xs text-primary underline cursor-pointer" onClick={e => {
                                    e.stopPropagation();
                                    const link = `${window.location.origin}/resa/${trip.id}/presentation/${r.id}`;
                                    navigator.clipboard.writeText(link);
                                    const el = e.currentTarget;
                                    el.textContent = 'Kopierad!';
                                    setTimeout(() => { el.textContent = 'Kopiera länk'; }, 1500);
                                  }}>Kopiera länk</span>
                                </TableCell>
                              )}
                              <TableCell className="text-sm text-muted-foreground">{new Date(r.created_at).toLocaleDateString('sv-SE')}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            ))}
            {grouped.length === 0 && (
              <div className="py-12 text-center text-muted-foreground">{alertType === 'unpaid' ? 'Alla har betalat!' : 'Alla har fyllt i sina svar!'}</div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default AlertListPage;
