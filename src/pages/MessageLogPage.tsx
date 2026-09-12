import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Loader2, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Header from '@/components/layout/Header';
import MessageLogTable from '@/components/admin/MessageLogTable';
import { useTrips } from '@/hooks/useTrips';
import { useMessageLog, useResendMessage } from '@/hooks/useMessages';
import { MessageLogEntry, MessageStatus, messageStatusLabels } from '@/lib/messaging';
import { toast } from 'sonner';

type StatusFilter = 'all' | 'problem' | MessageStatus;

const statusOptions: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Alla' },
  { value: 'problem', label: 'Misslyckade + delvis' },
  { value: 'failed', label: messageStatusLabels.failed },
  { value: 'partial', label: messageStatusLabels.partial },
  { value: 'sent', label: messageStatusLabels.sent },
];

/**
 * Utskicksloggen: varje mejl och SMS som portalen försökt skicka, med utfall per
 * mottagare. Filtrerbar via ?trip=<id> och ?status=<filter>.
 */
const MessageLogPage = () => {
  const [params, setParams] = useSearchParams();
  const tripFilter = params.get('trip') || 'all';
  const statusFilter = (params.get('status') || 'all') as StatusFilter;

  const { data: trips = [], isLoading: tripsLoading } = useTrips();
  const { data: entries = [], isLoading, isFetching, refetch } = useMessageLog(
    tripFilter !== 'all' ? { trip_id: tripFilter, limit: 1000 } : { limit: 1000 },
  );
  const resend = useResendMessage();

  const tripTitles = useMemo(() => Object.fromEntries(trips.map(t => [t.id, t.title])), [trips]);

  const filtered = useMemo(() => entries.filter(e =>
    statusFilter === 'all' ? true
      : statusFilter === 'problem' ? e.status !== 'sent'
      : e.status === statusFilter,
  ), [entries, statusFilter]);

  const problemCount = entries.filter(e => e.status !== 'sent').length;

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value === 'all') next.delete(key); else next.set(key, value);
    setParams(next, { replace: true });
  };

  const handleResend = async (entry: MessageLogEntry) => {
    try {
      const out = await resend.mutateAsync(entry.id);
      if (out.success) toast.success(`Skickat till ${entry.recipient_name || entry.recipient_email || entry.recipient_phone}`);
      else toast.error(`Gick inte att skicka om: ${out.error || 'okänt fel'}`);
    } catch (err) {
      toast.error(`Gick inte att skicka om: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  if (isLoading || tripsLoading) {
    return (<div className="flex min-h-screen flex-col bg-muted/30"><Header /><div className="flex flex-1 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></div>);
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <Header />
      <main className="container flex-1 py-8">
        <Link to="/dashboard" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Tillbaka till dashboard
        </Link>
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold">Utskick</h1>
            <p className="text-sm text-muted-foreground">
              Alla mejl och SMS som portalen försökt skicka, med utfall per mottagare.
              {problemCount > 0 && <span className="ml-1 font-medium text-destructive">{problemCount} behöver åtgärd.</span>}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={tripFilter} onValueChange={v => setParam('trip', v)}>
              <SelectTrigger className="w-56"><SelectValue placeholder="Alla resor" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alla resor</SelectItem>
                {trips.map(t => <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={v => setParam('status', v)}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                {statusOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" title="Uppdatera" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{filtered.length} utskick</CardTitle>
          </CardHeader>
          <CardContent>
            <MessageLogTable
              entries={filtered}
              tripTitles={tripTitles}
              onResend={handleResend}
              resendingId={resend.isPending ? resend.variables ?? null : null}
              emptyText={entries.length === 0 ? 'Inga utskick loggade ännu. Loggen börjar fyllas från och med nästa mejl eller SMS.' : 'Inga utskick matchar filtret.'}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default MessageLogPage;
