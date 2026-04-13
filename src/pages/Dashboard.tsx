import { Link, useNavigate } from 'react-router-dom';
import { Plus, CreditCard, FileText, AlertTriangle, Loader2, Download, Cake } from 'lucide-react';
import { useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/layout/Header';
import { useTrips, useAllRegistrations } from '@/hooks/useTrips';

const statusLabels: Record<string, string> = {
  draft: 'Utkast', published: 'Publicerad', closed: 'Stängd',
};
const statusVariants: Record<string, 'default' | 'secondary' | 'outline'> = {
  draft: 'secondary', published: 'default', closed: 'outline',
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { data: trips = [], isLoading: tripsLoading } = useTrips();
  const { data: registrations = [], isLoading: regsLoading } = useAllRegistrations();

  const loading = tripsLoading || regsLoading;

  const tripsWithPresentation = useMemo(() => new Set(trips.filter(t => t.presentation_fields.length > 0).map(t => t.id)), [trips]);

  const alerts = useMemo(() => {
    const unpaidRegs = registrations.filter(r => r.payment_status === 'unpaid');
    const missingPresentation = registrations.filter(r => tripsWithPresentation.has(r.trip_id) && (!r.presentation_data || Object.keys(r.presentation_data).length === 0));
    const lowSpotsTrips = trips
      .filter(t => t.status === 'published')
      .filter(t => {
        const regCount = registrations.filter(r => r.trip_id === t.id).length;
        const spotsLeft = t.max_participants - regCount;
        return spotsLeft > 0 && spotsLeft <= 10;
      });

    // Find birthdays during trips
    const birthdaysDuringTrip: { reg: typeof registrations[number]; trip: typeof trips[number]; date: string }[] = [];
    trips.forEach(trip => {
      const tripStart = new Date(trip.start_date);
      const tripEnd = new Date(trip.end_date);
      registrations.filter(r => r.trip_id === trip.id).forEach(r => {
        const bdStr = r.form_data['Födelsedatum'] || r.form_data['födelsedatum'] || r.form_data['Födelsedag'] || r.form_data['födelsedag'];
        if (!bdStr) return;
        const bd = new Date(bdStr);
        if (isNaN(bd.getTime())) return;
        // Check if birthday falls within trip dates (same month/day, any year)
        const tripYear = tripStart.getFullYear();
        const bdThisYear = new Date(tripYear, bd.getMonth(), bd.getDate());
        if (bdThisYear >= tripStart && bdThisYear <= tripEnd) {
          birthdaysDuringTrip.push({
            reg: r,
            trip,
            date: bdThisYear.toLocaleDateString('sv-SE', { day: 'numeric', month: 'long' }),
          });
        }
      });
    });

    return { unpaidRegs, missingPresentation, lowSpotsTrips, birthdaysDuringTrip };
  }, [trips, registrations]);

  const exportPassengers = useCallback(() => {
    const headers = ['Förnamn', 'Efternamn', 'E-post', 'Telefon', 'Resa', 'Betalningsstatus'];
    const rows = registrations.map(r => {
      const trip = trips.find(t => t.id === r.trip_id);
      return [
        r.form_data['Förnamn'] || '',
        r.form_data['Efternamn'] || '',
        r.form_data['E-post'] || '',
        r.form_data['Telefon'] || '',
        trip?.title || '',
        r.payment_status === 'paid' ? 'Betald' : r.payment_status === 'partial' ? 'Deposition betald' : r.payment_status === 'refunded' ? 'Återbetald' : 'Ej betald',
      ];
    });
    const csv = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `passagerarlista_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }, [registrations, trips]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-muted/30">
        <Header />
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <Header />
      <main className="container flex-1 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold">Dashboard</h1>
            <p className="text-sm text-muted-foreground">Hantera dina resor och anmälningar</p>
          </div>
          <div className="flex gap-2">
            {registrations.length > 0 && (
              <Button variant="outline" className="gap-2" onClick={exportPassengers}>
                <Download className="h-4 w-4" /> Exportera passagerare
              </Button>
            )}
            <Link to="/dashboard/resor/ny">
              <Button className="gap-2"><Plus className="h-4 w-4" /> Skapa resa</Button>
            </Link>
          </div>
        </div>

        {/* Actionable alerts */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card
            className={`cursor-pointer transition-colors hover:bg-muted/50 ${alerts.unpaidRegs.length > 0 ? 'border-destructive/30' : ''}`}
            onClick={() => navigate('/dashboard/alerts/unpaid')}
          >
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`rounded-lg p-2.5 ${alerts.unpaidRegs.length > 0 ? 'bg-destructive/10' : 'bg-accent'}`}>
                <CreditCard className={`h-5 w-5 ${alerts.unpaidRegs.length > 0 ? 'text-destructive' : 'text-primary'}`} />
              </div>
              <div>
                <p className="text-2xl font-bold font-heading">{alerts.unpaidRegs.length}</p>
                <p className="text-sm text-muted-foreground">Inväntar betalning</p>
              </div>
            </CardContent>
          </Card>

          {tripsWithPresentation.size > 0 && (
            <Card
              className={`cursor-pointer transition-colors hover:bg-muted/50 ${alerts.missingPresentation.length > 0 ? 'border-yellow-400/30' : ''}`}
              onClick={() => navigate('/dashboard/alerts/missing-presentation')}
            >
              <CardContent className="flex items-center gap-4 p-5">
                <div className={`rounded-lg p-2.5 ${alerts.missingPresentation.length > 0 ? 'bg-yellow-100' : 'bg-accent'}`}>
                  <FileText className={`h-5 w-5 ${alerts.missingPresentation.length > 0 ? 'text-yellow-700' : 'text-primary'}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold font-heading">{alerts.missingPresentation.length}</p>
                  <p className="text-sm text-muted-foreground">Saknar "Lär känna"-svar</p>
                </div>
              </CardContent>
            </Card>
          )}

          <Card
            className={`cursor-pointer transition-colors hover:bg-muted/50 ${alerts.lowSpotsTrips.length > 0 ? 'border-orange-400/30' : ''}`}
            onClick={() => navigate('/dashboard/alerts/low-spots')}
          >
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`rounded-lg p-2.5 ${alerts.lowSpotsTrips.length > 0 ? 'bg-orange-100' : 'bg-accent'}`}>
                <AlertTriangle className={`h-5 w-5 ${alerts.lowSpotsTrips.length > 0 ? 'text-orange-600' : 'text-primary'}`} />
              </div>
              <div>
                <p className="text-2xl font-bold font-heading">{alerts.lowSpotsTrips.length}</p>
                <p className="text-sm text-muted-foreground">Resor med få platser kvar</p>
              </div>
            </CardContent>
          </Card>

          <Card className={`transition-colors ${alerts.birthdaysDuringTrip.length > 0 ? 'border-pink-400/30' : ''}`}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`rounded-lg p-2.5 ${alerts.birthdaysDuringTrip.length > 0 ? 'bg-pink-100' : 'bg-accent'}`}>
                <Cake className={`h-5 w-5 ${alerts.birthdaysDuringTrip.length > 0 ? 'text-pink-600' : 'text-primary'}`} />
              </div>
              <div>
                <p className="text-2xl font-bold font-heading">{alerts.birthdaysDuringTrip.length}</p>
                <p className="text-sm text-muted-foreground">Fyller år under resa</p>
                {alerts.birthdaysDuringTrip.length > 0 && (
                  <div className="mt-1 space-y-0.5">
                    {alerts.birthdaysDuringTrip.slice(0, 3).map((b, i) => (
                      <p key={i} className="text-xs text-pink-600">
                        {b.reg.form_data['Förnamn']} {b.reg.form_data['Efternamn']} — {b.date}
                      </p>
                    ))}
                    {alerts.birthdaysDuringTrip.length > 3 && (
                      <p className="text-xs text-muted-foreground">+{alerts.birthdaysDuringTrip.length - 3} till</p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Trip List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Alla resor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {trips.length === 0 && (
                <div className="py-12 text-center text-muted-foreground">Inga resor ännu. Skapa din första resa!</div>
              )}
              {trips.map(trip => {
                const regs = registrations.filter(r => r.trip_id === trip.id);
                const regCount = regs.length;
                const unpaidCount = regs.filter(r => r.payment_status === 'unpaid').length;
                const hasPresentationFields = trip.presentation_fields.length > 0;
                const missingPres = hasPresentationFields ? regs.filter(r => !r.presentation_data || Object.keys(r.presentation_data).length === 0).length : 0;
                return (
                  <Link
                    key={trip.id}
                    to={`/dashboard/resor/${trip.id}`}
                    className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-4">
                      {trip.image_url && <img src={trip.image_url} alt={trip.title} className="h-12 w-12 rounded-md object-cover" />}
                      <div>
                        <p className="font-heading font-semibold">{trip.title}</p>
                        <p className="text-sm text-muted-foreground">{trip.destination} · {new Date(trip.start_date).toLocaleDateString('sv-SE')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {unpaidCount > 0 && (
                        <span className="inline-flex items-center rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                          {unpaidCount} obetald{unpaidCount > 1 ? 'a' : ''}
                        </span>
                      )}
                      {missingPres > 0 && (
                        <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">
                          {missingPres} utan svar
                        </span>
                      )}
                      <span className="text-sm text-muted-foreground">{regCount}/{trip.max_participants}</span>
                      <Badge variant={statusVariants[trip.status]}>{statusLabels[trip.status]}</Badge>
                    </div>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;
