import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Share2, Download, Mail, Filter } from 'lucide-react';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Header from '@/components/layout/Header';
import { mockTrips, mockRegistrations } from '@/data/mockTrips';
import { PaymentStatus } from '@/types/trip';
import { toast } from 'sonner';

const paymentLabels: Record<PaymentStatus, string> = {
  unpaid: 'Ej betald', paid: 'Betald', partial: 'Delbetalad', refunded: 'Återbetald',
};
const paymentColors: Record<PaymentStatus, string> = {
  unpaid: 'bg-destructive/10 text-destructive',
  paid: 'bg-green-100 text-green-700',
  partial: 'bg-yellow-100 text-yellow-700',
  refunded: 'bg-muted text-muted-foreground',
};

const TripDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const trip = mockTrips.find(t => t.id === id);
  const registrations = mockRegistrations.filter(r => r.trip_id === id);

  const [filterField, setFilterField] = useState<string>('');
  const [filterValue, setFilterValue] = useState<string>('');

  const fieldLabels = trip?.form_fields.map(f => f.label) ?? [];

  // Get unique values for selected field
  const uniqueValues = useMemo(() => {
    if (!filterField) return [];
    const values = new Set<string>();
    registrations.forEach(r => {
      const val = r.form_data[filterField];
      if (val !== undefined && val !== null && val !== '') {
        values.add(String(val));
      }
    });
    return Array.from(values).sort();
  }, [filterField, registrations]);

  const filteredRegs = useMemo(() => {
    if (!filterField || !filterValue) return registrations;
    return registrations.filter(r => String(r.form_data[filterField]) === filterValue);
  }, [registrations, filterField, filterValue]);

  const summary = useMemo(() => {
    if (!trip) return {};
    const counts: Record<string, Record<string, number>> = {};
    trip.form_fields.filter(f => f.type === 'select' || f.type === 'checkbox').forEach(field => {
      counts[field.label] = {};
      registrations.forEach(r => {
        const val = String(r.form_data[field.label] ?? '');
        if (val) counts[field.label][val] = (counts[field.label][val] || 0) + 1;
      });
    });
    return counts;
  }, [registrations, trip]);

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

  const exportCSV = () => {
    const headers = ['#', ...fieldLabels, 'Betalningsstatus', 'Datum'];
    const rows = filteredRegs.map((r, i) => [
      i + 1,
      ...fieldLabels.map(l => String(r.form_data[l] ?? '')),
      paymentLabels[r.payment_status],
      new Date(r.created_at).toLocaleDateString('sv-SE'),
    ]);
    const csv = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${trip.title.replace(/\s/g, '_')}_deltagare.csv`;
    a.click();
    toast.success('CSV exporterad!');
  };

  const shareLink = `${window.location.origin}/resa/${trip.id}`;

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <Header />
      <main className="container flex-1 py-8">
        <Link to="/dashboard" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Tillbaka till dashboard
        </Link>

        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold">{trip.title}</h1>
            <p className="text-sm text-muted-foreground">{trip.destination} · {new Date(trip.start_date).toLocaleDateString('sv-SE')}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={() => { navigator.clipboard.writeText(shareLink); toast.success('Länk kopierad!'); }}>
              <Share2 className="h-4 w-4" /> Dela länk
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={exportCSV}>
              <Download className="h-4 w-4" /> Exportera CSV
            </Button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="mb-6 grid gap-4 sm:grid-cols-4">
          <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold font-heading">{registrations.length}</p><p className="text-sm text-muted-foreground">Anmälda</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold font-heading">{trip.max_participants - registrations.length}</p><p className="text-sm text-muted-foreground">Platser kvar</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold font-heading text-green-600">{registrations.filter(r => r.payment_status === 'paid').length}</p><p className="text-sm text-muted-foreground">Betalda</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold font-heading text-destructive">{registrations.filter(r => r.payment_status === 'unpaid').length}</p><p className="text-sm text-muted-foreground">Ej betalda</p></CardContent></Card>
        </div>

        {/* Summary */}
        {Object.keys(summary).length > 0 && (
          <Card className="mb-6">
            <CardHeader><CardTitle className="text-lg">Sammanställning</CardTitle></CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {Object.entries(summary).map(([field, values]) => (
                  <div key={field}>
                    <p className="mb-2 font-heading text-sm font-semibold">{field}</p>
                    <div className="space-y-1">
                      {Object.entries(values).map(([val, count]) => {
                        const isActive = filterField === field && filterValue === val;
                        return (
                          <button
                            key={val}
                            onClick={() => {
                              if (isActive) { setFilterField(''); setFilterValue(''); }
                              else { setFilterField(field); setFilterValue(val); }
                            }}
                            className={`flex w-full items-center justify-between rounded-md px-2 py-1 text-sm transition-colors hover:bg-accent ${isActive ? 'bg-accent ring-1 ring-primary/30' : ''}`}
                          >
                            <span className="text-muted-foreground">{val === 'true' ? 'Ja' : val === 'false' ? 'Nej' : val}</span>
                            <Badge variant="secondary">{count} st</Badge>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filter & Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <CardTitle className="text-lg">Deltagare ({filteredRegs.length})</CardTitle>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={filterField} onValueChange={v => { setFilterField(v); setFilterValue(''); }}>
                  <SelectTrigger className="w-44"><SelectValue placeholder="Filtrera på fält..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">Inget filter</SelectItem>
                    {fieldLabels.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
                {filterField && filterField !== '__none' && uniqueValues.length > 0 && (
                  <Select value={filterValue} onValueChange={setFilterValue}>
                    <SelectTrigger className="w-44"><SelectValue placeholder="Välj värde..." /></SelectTrigger>
                    <SelectContent>
                      {uniqueValues.map(v => <SelectItem key={v} value={v}>{v === 'true' ? 'Ja' : v === 'false' ? 'Nej' : v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    {fieldLabels.slice(0, 6).map(l => <TableHead key={l}>{l}</TableHead>)}
                    <TableHead>Betalning</TableHead>
                    <TableHead>Datum</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRegs.map((r, i) => (
                    <TableRow key={r.id}>
                      <TableCell>{i + 1}</TableCell>
                      {fieldLabels.slice(0, 6).map(l => (
                        <TableCell key={l} className="max-w-[150px] truncate">
                          {String(r.form_data[l] === true ? 'Ja' : r.form_data[l] === false ? 'Nej' : r.form_data[l] ?? '–')}
                        </TableCell>
                      ))}
                      <TableCell>
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${paymentColors[r.payment_status]}`}>
                          {paymentLabels[r.payment_status]}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(r.created_at).toLocaleDateString('sv-SE')}
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredRegs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">Inga deltagare matchar filtret</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default TripDetailsPage;
