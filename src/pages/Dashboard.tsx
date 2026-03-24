import { Link, useNavigate } from 'react-router-dom';
import { Plus, CreditCard, FileText, AlertTriangle } from 'lucide-react';
import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/layout/Header';
import { mockTrips, mockRegistrations } from '@/data/mockTrips';

const statusLabels: Record<string, string> = {
  draft: 'Utkast', published: 'Publicerad', closed: 'Stängd',
};
const statusVariants: Record<string, 'default' | 'secondary' | 'outline'> = {
  draft: 'secondary', published: 'default', closed: 'outline',
};

const Dashboard = () => {
  const navigate = useNavigate();

  const alerts = useMemo(() => {
    const unpaidRegs = mockRegistrations.filter(r => r.payment_status === 'unpaid');
    const missingPresentation = mockRegistrations.filter(r => !r.presentation_data || Object.keys(r.presentation_data).length === 0);

    const lowSpotsTrips = mockTrips
      .filter(t => t.status === 'published')
      .filter(t => {
        const regCount = mockRegistrations.filter(r => r.trip_id === t.id).length;
        const spotsLeft = t.max_participants - regCount;
        return spotsLeft > 0 && spotsLeft <= 10;
      });

    return { unpaidRegs, missingPresentation, lowSpotsTrips };
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <Header />
      <main className="container flex-1 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold">Dashboard</h1>
            <p className="text-sm text-muted-foreground">Hantera dina resor och anmälningar</p>
          </div>
          <Link to="/dashboard/resor/ny">
            <Button className="gap-2"><Plus className="h-4 w-4" /> Skapa resa</Button>
          </Link>
        </div>

        {/* Actionable alerts */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Unpaid */}
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

          {/* Missing presentation */}
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

          {/* Low spots */}
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
        </div>

        {/* Trip List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Alla resor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockTrips.map(trip => {
                const regs = mockRegistrations.filter(r => r.trip_id === trip.id);
                const regCount = regs.length;
                const unpaidCount = regs.filter(r => r.payment_status === 'unpaid').length;
                const missingPres = regs.filter(r => !r.presentation_data || Object.keys(r.presentation_data).length === 0).length;
                return (
                  <Link
                    key={trip.id}
                    to={`/dashboard/resor/${trip.id}`}
                    className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-4">
                      <img src={trip.image_url} alt={trip.title} className="h-12 w-12 rounded-md object-cover" />
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
