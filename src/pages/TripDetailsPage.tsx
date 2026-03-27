import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Share2, Download, Filter, Pencil, FileText, Loader2, Send, ExternalLink } from 'lucide-react';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Header from '@/components/layout/Header';
import { useTrip, useRegistrations, useUpdateRegistration } from '@/hooks/useTrips';
import SendMessageDialog from '@/components/admin/SendMessageDialog';
import { PaymentStatus } from '@/types/trip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
  const navigate = useNavigate();
  const { data: trip, isLoading: tripLoading } = useTrip(id);
  const { data: registrations = [], isLoading: regsLoading } = useRegistrations(id);
  const updateRegistration = useUpdateRegistration();

  const [filterField, setFilterField] = useState<string>('');
  const [filterValue, setFilterValue] = useState<string>('');

  const fieldLabels = trip?.form_fields.map(f => f.label) ?? [];
  const allFilterLabels = [...fieldLabels, 'Betalningsstatus', 'Anmälningsdatum'];

  const getColumnValue = (r: typeof registrations[number], col: string): string => {
    if (col === 'Betalningsstatus') return paymentLabels[r.payment_status];
    if (col === 'Anmälningsdatum') return new Date(r.created_at).toLocaleDateString('sv-SE');
    const val = r.form_data[col];
    if (val === true) return 'Ja';
    if (val === false) return 'Nej';
    return val != null && val !== '' ? String(val) : '';
  };

  const uniqueValues = useMemo(() => {
    if (!filterField) return [];
    const values = new Set<string>();
    registrations.forEach(r => {
      const val = getColumnValue(r, filterField);
      if (val) values.add(val);
    });
    return Array.from(values).sort();
  }, [filterField, registrations]);

  const filteredRegs = useMemo(() => {
    if (!filterField || !filterValue) return registrations;
    return registrations.filter(r => getColumnValue(r, filterField) === filterValue);
  }, [registrations, filterField, filterValue]);

  const summary = useMemo(() => {
    if (!trip) return { counts: {}, lists: {} };
    const counts: Record<string, Record<string, number>> = {};
    const lists: Record<string, string[]> = {};

    trip.form_fields.filter(f => f.showInSummary).forEach(field => {
      if (field.type === 'select' || field.type === 'checkbox') {
        counts[field.label] = {};
        registrations.forEach(r => {
          const val = getColumnValue(r, field.label);
          if (val) counts[field.label][val] = (counts[field.label][val] || 0) + 1;
        });
      } else {
        const values: string[] = [];
        registrations.forEach(r => {
          const val = getColumnValue(r, field.label);
          if (val) values.push(val);
        });
        if (values.length > 0) lists[field.label] = values;
      }
    });

    counts['Betalningsstatus'] = {};
    registrations.forEach(r => {
      const val = paymentLabels[r.payment_status];
      counts['Betalningsstatus'][val] = (counts['Betalningsstatus'][val] || 0) + 1;
    });

    return { counts, lists };
  }, [registrations, trip]);

  if (tripLoading || regsLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-muted/30">
        <Header />
        <div className="flex flex-1 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <div className="container flex flex-1 items-center justify-center"><p>Resan hittades inte</p></div>
      </div>
    );
  }

  const exportCSV = () => {
    const headers = ['#', ...allFilterLabels];
    const rows = filteredRegs.map((r, i) => [i + 1, ...allFilterLabels.map(col => getColumnValue(r, col))]);
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
          <div className="flex flex-wrap gap-2">
            <a href={`/resa/${trip.id}`} target="_blank" rel="noopener noreferrer"><Button variant="outline" size="sm" className="gap-2"><ExternalLink className="h-4 w-4" /> Visa bokningssida</Button></a>
            <Link to={`/dashboard/resor/${trip.id}/redigera`}><Button variant="outline" size="sm" className="gap-2"><Pencil className="h-4 w-4" /> Redigera</Button></Link>
            <Link to={`/dashboard/resor/${trip.id}/presentation`}><Button variant="outline" size="sm" className="gap-2"><FileText className="h-4 w-4" /> Deltagarpresentation</Button></Link>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => { navigator.clipboard.writeText(shareLink); toast.success('Länk kopierad!'); }}><Share2 className="h-4 w-4" /> Kopiera länk</Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={exportCSV}><Download className="h-4 w-4" /> Exportera CSV</Button>
          </div>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-4">
          <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold font-heading">{registrations.length}</p><p className="text-sm text-muted-foreground">Anmälda</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold font-heading">{trip.max_participants - registrations.length}</p><p className="text-sm text-muted-foreground">Platser kvar</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold font-heading text-green-600">{registrations.filter(r => r.payment_status === 'paid').length}</p><p className="text-sm text-muted-foreground">Betalda</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold font-heading text-destructive">{registrations.filter(r => r.payment_status === 'unpaid').length}</p><p className="text-sm text-muted-foreground">Ej betalda</p></CardContent></Card>
        </div>

        {(Object.keys(summary.counts).length > 0 || Object.keys(summary.lists).length > 0) && (
          <Card className="mb-6">
            <CardHeader><CardTitle className="text-lg">Sammanställning</CardTitle></CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {Object.entries(summary.counts).map(([field, values]) => (
                  <div key={field}>
                    <p className="mb-2 font-heading text-sm font-semibold">{field}</p>
                    <div className="space-y-1">
                      {Object.entries(values).map(([val, count]) => {
                        const isActive = filterField === field && filterValue === val;
                        return (
                          <button key={val} onClick={() => { if (isActive) { setFilterField(''); setFilterValue(''); } else { setFilterField(field); setFilterValue(val); } }}
                            className={`flex w-full items-center justify-between rounded-md px-2 py-1 text-sm transition-colors hover:bg-accent ${isActive ? 'bg-accent ring-1 ring-primary/30' : ''}`}>
                            <span className="text-muted-foreground">{val === 'true' ? 'Ja' : val === 'false' ? 'Nej' : val}</span>
                            <Badge variant="secondary">{count} st</Badge>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
                {Object.entries(summary.lists).map(([field, values]) => (
                  <div key={field}>
                    <p className="mb-2 font-heading text-sm font-semibold">{field}</p>
                    <div className="space-y-0.5 max-h-48 overflow-y-auto">
                      {values.map((val, i) => (<p key={i} className="text-sm text-muted-foreground truncate">• {val}</p>))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <CardTitle className="text-lg">Deltagare ({filteredRegs.length})</CardTitle>
                {filteredRegs.length > 0 && (
                  <SendMessageDialog
                    recipients={filteredRegs}
                    filterLabel={filterField && filterField !== '__none' ? filterField : undefined}
                    filterValue={filterValue || undefined}
                    tripTitle={trip.title}
                  />
                )}
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={filterField} onValueChange={v => { setFilterField(v); setFilterValue(''); }}>
                  <SelectTrigger className="w-44"><SelectValue placeholder="Filtrera på fält..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">Inget filter</SelectItem>
                    {allFilterLabels.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
                {filterField && filterField !== '__none' && uniqueValues.length > 0 && (
                  <Select value={filterValue} onValueChange={setFilterValue}>
                    <SelectTrigger className="w-44"><SelectValue placeholder="Välj värde..." /></SelectTrigger>
                    <SelectContent>{uniqueValues.map(v => <SelectItem key={v} value={v}>{v === 'true' ? 'Ja' : v === 'false' ? 'Nej' : v}</SelectItem>)}</SelectContent>
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
                    <TableHead className="w-10">#</TableHead>
                    {allFilterLabels.map(l => <TableHead key={l}>{l}</TableHead>)}
                    <TableHead>Lär känna</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRegs.map((r, i) => (
                    <TableRow key={r.id} className="cursor-pointer hover:bg-accent/50" onClick={() => navigate(`/dashboard/resor/${trip.id}/deltagare/${r.id}`)}>
                      <TableCell>{i + 1}</TableCell>
                      {allFilterLabels.map(col => (
                        <TableCell key={col} className="max-w-[180px] truncate">
                          {col === 'Betalningsstatus' ? (
                            <Popover>
                              <PopoverTrigger asChild>
                                <button
                                  onClick={e => e.stopPropagation()}
                                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium cursor-pointer hover:ring-2 hover:ring-primary/30 transition-all ${paymentColors[r.payment_status]}`}
                                >
                                  {paymentLabels[r.payment_status]}
                                </button>
                              </PopoverTrigger>
                              <PopoverContent className="w-40 p-1" onClick={e => e.stopPropagation()}>
                                {(Object.keys(paymentLabels) as PaymentStatus[]).map(status => (
                                  <button
                                    key={status}
                                    onClick={() => {
                                      updateRegistration.mutate(
                                        { id: r.id, payment_status: status },
                                        { onSuccess: () => toast.success(`${paymentLabels[status]} — ${r.form_data['Förnamn']} ${r.form_data['Efternamn']}`) }
                                      );
                                    }}
                                    className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors hover:bg-accent ${r.payment_status === status ? 'bg-accent font-medium' : ''}`}
                                  >
                                    <span className={`inline-block h-2 w-2 rounded-full ${paymentColors[status].split(' ')[0].replace('/10', '')}`} />
                                    {paymentLabels[status]}
                                  </button>
                                ))}
                              </PopoverContent>
                            </Popover>
                          ) : col === 'Anmälningsdatum' ? (
                            <span className="text-sm text-muted-foreground">{getColumnValue(r, col)}</span>
                          ) : (getColumnValue(r, col) || '–')}
                        </TableCell>
                      ))}
                      <TableCell>
                        {r.presentation_data && Object.keys(r.presentation_data).length > 0
                          ? <Badge variant="default" className="bg-green-100 text-green-700 hover:bg-green-100">Ifylld</Badge>
                          : <Badge variant="outline" className="text-muted-foreground">Saknas</Badge>}
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredRegs.length === 0 && (
                    <TableRow><TableCell colSpan={allFilterLabels.length + 2} className="py-8 text-center text-muted-foreground">Inga deltagare matchar filtret</TableCell></TableRow>
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
