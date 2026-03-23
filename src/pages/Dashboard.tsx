import { Link } from 'react-router-dom';
import { Plus, CalendarDays, Users, TrendingUp } from 'lucide-react';
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
  const totalTrips = mockTrips.length;
  const publishedTrips = mockTrips.filter(t => t.status === 'published').length;
  const totalRegistrations = mockRegistrations.length;
  const paidCount = mockRegistrations.filter(r => r.payment_status === 'paid').length;

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

        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Resor', value: totalTrips, icon: CalendarDays },
            { label: 'Publicerade', value: publishedTrips, icon: TrendingUp },
            { label: 'Anmälda', value: totalRegistrations, icon: Users },
            { label: 'Betalda', value: paidCount, icon: Users },
          ].map(stat => (
            <Card key={stat.label}>
              <CardContent className="flex items-center gap-4 p-5">
                <div className="rounded-lg bg-accent p-2.5">
                  <stat.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold font-heading">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Trip List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Alla resor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockTrips.map(trip => {
                const regCount = mockRegistrations.filter(r => r.trip_id === trip.id).length;
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
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground">{regCount}/{trip.max_participants} anmälda</span>
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
