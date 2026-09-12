import { Fragment, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, RotateCcw, Mail, MessageSquare, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  MessageLogEntry, MessageStatus, messageStatusLabels, messageKindLabels, messageChannelLabels,
} from '@/lib/messaging';

const statusColors: Record<MessageStatus, string> = {
  sent: 'bg-green-100 text-green-700',
  failed: 'bg-destructive/10 text-destructive',
  partial: 'bg-yellow-100 text-yellow-700',
};

const formatSentAt = (iso: string) =>
  new Date(iso).toLocaleString('sv-SE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

interface MessageLogTableProps {
  entries: MessageLogEntry[];
  /** Resans namn per id — visas som egen kolumn när tabellen spänner flera resor. */
  tripTitles?: Record<string, string>;
  /** Dölj mottagarkolumnen när alla rader gäller samma person (deltagarsidan). */
  hideRecipient?: boolean;
  onResend: (entry: MessageLogEntry) => void;
  resendingId?: string | null;
  emptyText?: string;
}

/**
 * Utskicksloggen som tabell. Raden expanderar till hela meddelandet + felet;
 * misslyckade och delvis skickade rader har en Skicka om-knapp.
 */
const MessageLogTable = ({ entries, tripTitles, hideRecipient, onResend, resendingId, emptyText }: MessageLogTableProps) => {
  const [openId, setOpenId] = useState<string | null>(null);

  if (entries.length === 0) {
    return <div className="py-10 text-center text-sm text-muted-foreground">{emptyText ?? 'Inga utskick ännu.'}</div>;
  }

  const showTrip = !!tripTitles;
  const columns = 6 + (hideRecipient ? 0 : 1) + (showTrip ? 1 : 0);

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8" />
            <TableHead>Tid</TableHead>
            {!hideRecipient && <TableHead>Mottagare</TableHead>}
            {showTrip && <TableHead>Resa</TableHead>}
            <TableHead>Typ</TableHead>
            <TableHead>Kanal</TableHead>
            <TableHead>Innehåll</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Åtgärd</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map(e => {
            const open = openId === e.id;
            const canResend = e.status !== 'sent';
            const preview = (e.subject || e.message).replace(/\s+/g, ' ').slice(0, 60);
            return (
              <Fragment key={e.id}>
                <TableRow className="cursor-pointer hover:bg-accent/50" onClick={() => setOpenId(open ? null : e.id)}>
                  <TableCell className="text-muted-foreground">
                    {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{formatSentAt(e.created_at)}</TableCell>
                  {!hideRecipient && (
                    <TableCell>
                      <p className="text-sm font-medium">{e.recipient_name || '–'}</p>
                      <p className="text-xs text-muted-foreground">{e.recipient_email || e.recipient_phone || '–'}</p>
                    </TableCell>
                  )}
                  {showTrip && (
                    <TableCell className="text-sm">{(e.trip_id && tripTitles?.[e.trip_id]) || <span className="text-muted-foreground">–</span>}</TableCell>
                  )}
                  <TableCell className="text-sm">{messageKindLabels[e.kind] ?? e.kind}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1 text-sm">
                      {e.channel !== 'sms' && <Mail className="h-3.5 w-3.5 text-muted-foreground" />}
                      {e.channel !== 'email' && <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />}
                      {messageChannelLabels[e.channel] ?? e.channel}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-[16rem] truncate text-sm" title={e.subject || undefined}>{preview}{(e.subject || e.message).length > 60 ? '…' : ''}</TableCell>
                  <TableCell>
                    <span className={`inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[e.status] ?? ''}`}>
                      {messageStatusLabels[e.status] ?? e.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    {canResend && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5"
                        disabled={resendingId === e.id}
                        onClick={ev => { ev.stopPropagation(); onResend(e); }}
                      >
                        {resendingId === e.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                        Skicka om
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
                {open && (
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableCell colSpan={columns} className="space-y-3 p-4">
                      {e.error && (
                        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                          <span className="font-medium">Fel: </span>{e.error}
                        </div>
                      )}
                      {e.subject && <p className="text-sm"><span className="text-muted-foreground">Ämne: </span>{e.subject}</p>}
                      <p className="whitespace-pre-line text-sm">{e.message}</p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        {e.recipient_email && <span>E-post: {e.recipient_email}{e.email_ok === false ? ' (misslyckades)' : ''}</span>}
                        {e.recipient_phone && <span>Telefon: {e.recipient_phone}{e.sms_ok === false ? ' (misslyckades)' : ''}</span>}
                        {e.resent_from && <span>Omsändning av ett tidigare försök</span>}
                        {e.registration_id && e.trip_id && (
                          <Link to={`/dashboard/resor/${e.trip_id}/deltagare/${e.registration_id}`} className="text-primary underline" onClick={ev => ev.stopPropagation()}>
                            Öppna deltagaren
                          </Link>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default MessageLogTable;
