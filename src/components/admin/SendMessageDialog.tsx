import { useState } from 'react';
import { Send, Mail, MessageSquare, Loader2, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Registration } from '@/types/trip';
import { sendMessage, summarizeSendErrors } from '@/lib/messaging';
import { toast } from 'sonner';

type Channel = 'email' | 'sms' | 'both';

interface SendMessageDialogProps {
  recipients: Registration[];
  filterLabel?: string;
  filterValue?: string;
  tripTitle: string;
  /** Egen knapp — används för enskild resenär, där "Skicka meddelande (1)" läser konstigt. */
  trigger?: React.ReactNode;
}

const fullName = (r: Registration) =>
  `${r.form_data['Förnamn'] || ''} ${r.form_data['Efternamn'] || ''}`.trim();

const SendMessageDialog = ({ recipients, filterLabel, filterValue, tripTitle, trigger }: SendMessageDialogProps) => {
  const [open, setOpen] = useState(false);
  const [channel, setChannel] = useState<Channel>('email');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const isSingle = recipients.length === 1;
  const recipientNames = recipients.map(fullName).filter(Boolean);
  const emails = recipients.map(r => r.form_data['E-post']).filter(Boolean);
  const phones = recipients.map(r => r.form_data['Telefon']).filter(Boolean);
  const hasEmail = emails.length > 0;
  const hasPhone = phones.length > 0;

  // Mottagare som inte går att nå på den valda kanalen — säg det före utskicket
  // i stället för att tyst hoppa över dem (edge-funktionen skickar bara till den
  // som faktiskt har adress respektive nummer).
  const unreachable =
    channel === 'email' ? recipients.length - emails.length
      : channel === 'sms' ? recipients.length - phones.length
      : recipients.filter(r => !r.form_data['E-post'] && !r.form_data['Telefon']).length;

  // Öppna på en kanal som faktiskt går att använda.
  const handleOpenChange = (next: boolean) => {
    if (next) setChannel(hasEmail ? 'email' : hasPhone ? 'sms' : 'email');
    setOpen(next);
  };

  const handleSend = async () => {
    if (!message.trim()) {
      toast.error('Skriv ett meddelande');
      return;
    }
    if ((channel === 'email' || channel === 'both') && !subject.trim()) {
      toast.error('Ange ett ämne för e-post');
      return;
    }
    if (unreachable === recipients.length) {
      toast.error('Ingen av mottagarna går att nå på den valda kanalen');
      return;
    }

    setSending(true);
    try {
      const result = await sendMessage({
        channel,
        subject,
        message,
        recipients: recipients.map(r => ({
          name: fullName(r),
          email: r.form_data['E-post'] || undefined,
          phone: r.form_data['Telefon'] || undefined,
        })),
      });

      if (result.success) {
        const channelLabel = channel === 'email' ? 'E-post' : channel === 'sms' ? 'SMS' : 'E-post + SMS';
        toast.success(
          isSingle
            ? `${channelLabel} skickat till ${recipientNames[0] || 'mottagaren'}`
            : `${channelLabel} skickat till ${recipients.length} mottagare`,
        );
        setOpen(false);
        setMessage('');
        setSubject('');
      } else {
        // Vid delvis lyckat utskick står det i results vilka som inte nåddes.
        const detail = summarizeSendErrors(result.results);
        toast.error(detail ? `Kunde inte skicka till: ${detail}` : (result.error || 'Kunde inte skicka meddelandet'));
      }
    } catch {
      toast.error('Något gick fel vid skickandet');
    } finally {
      setSending(false);
    }
  };

  const filterDescription = filterLabel && filterValue
    ? `${filterValue === 'true' ? 'Ja' : filterValue === 'false' ? 'Nej' : filterValue} (${filterLabel})`
    : 'Alla deltagare';

  const channelButton = (value: Channel, icon: React.ReactNode, label: string, enabled: boolean) => (
    <Button
      type="button"
      variant={channel === value ? 'default' : 'outline'}
      size="sm"
      className="gap-1.5"
      disabled={!enabled}
      title={enabled ? undefined : 'Kontaktuppgift saknas'}
      onClick={() => setChannel(value)}
    >
      {icon} {label}
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" className="gap-2">
            <Send className="h-4 w-4" /> Skicka meddelande ({recipients.length})
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading">
            {isSingle ? `Meddelande till ${recipientNames[0] || 'resenär'}` : 'Skicka meddelande'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Mottagare */}
          <div className="rounded-lg bg-muted p-3">
            {isSingle ? (
              <>
                <p className="text-sm font-medium">{recipientNames[0] || 'Resenär'}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {emails[0] || <span className="italic">ingen e-post</span>}
                  {' · '}
                  {phones[0] || <span className="italic">inget telefonnummer</span>}
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium">Mottagare</p>
                <p className="text-sm text-muted-foreground">
                  {recipients.length} deltagare — {filterDescription}
                </p>
                {recipientNames.length <= 8 ? (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {recipientNames.map((name, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">{name}</Badge>
                    ))}
                  </div>
                ) : (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {recipientNames.slice(0, 5).join(', ')} och {recipientNames.length - 5} till...
                  </p>
                )}
              </>
            )}
            <p className="mt-1 text-xs text-muted-foreground">{tripTitle}</p>
          </div>

          {/* Kanal */}
          <div className="space-y-1.5">
            <Label className="text-sm">Kanal</Label>
            <div className="flex gap-2">
              {channelButton('email', <Mail className="h-3.5 w-3.5" />, isSingle ? 'E-post' : `E-post (${emails.length})`, hasEmail)}
              {channelButton('sms', <MessageSquare className="h-3.5 w-3.5" />, isSingle ? 'SMS' : `SMS (${phones.length})`, hasPhone)}
              {channelButton('both', null, 'Båda', hasEmail && hasPhone)}
            </div>
            {unreachable > 0 && (
              <p className="flex items-start gap-1.5 text-xs text-yellow-700">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {isSingle
                  ? 'Resenären saknar kontaktuppgift för den valda kanalen.'
                  : `${unreachable} av ${recipients.length} saknar kontaktuppgift för den valda kanalen och hoppas över.`}
              </p>
            )}
          </div>

          {/* Ämne (bara e-post) */}
          {(channel === 'email' || channel === 'both') && (
            <div className="space-y-1.5">
              <Label className="text-sm">Ämne</Label>
              <input
                type="text"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder={`Info om ${tripTitle}`}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          )}

          {/* Meddelande */}
          <div className="space-y-1.5">
            <Label className="text-sm">Meddelande</Label>
            <Textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder={isSingle ? `Hej ${recipientNames[0]?.split(' ')[0] || ''}...` : 'Skriv ditt meddelande här...'}
              rows={5}
            />
            <p className="text-xs text-muted-foreground">
              Tips: Använd {'{förnamn}'} för att personalisera meddelandet.
            </p>
          </div>

          <Button onClick={handleSend} disabled={sending} className="w-full gap-2">
            {sending ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Skickar...</>
            ) : (
              <><Send className="h-4 w-4" /> {isSingle ? 'Skicka' : `Skicka till ${recipients.length} mottagare`}</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SendMessageDialog;
