import { useState } from 'react';
import { Send, Mail, MessageSquare, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Registration } from '@/types/trip';
import { toast } from 'sonner';

type Channel = 'email' | 'sms' | 'both';

interface SendMessageDialogProps {
  recipients: Registration[];
  filterLabel?: string;
  filterValue?: string;
  tripTitle: string;
}

const SendMessageDialog = ({ recipients, filterLabel, filterValue, tripTitle }: SendMessageDialogProps) => {
  const [open, setOpen] = useState(false);
  const [channel, setChannel] = useState<Channel>('email');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const recipientNames = recipients.map(r =>
    `${r.form_data['Förnamn'] || ''} ${r.form_data['Efternamn'] || ''}`.trim()
  ).filter(Boolean);

  const emails = recipients.map(r => r.form_data['E-post']).filter(Boolean);
  const phones = recipients.map(r => r.form_data['Telefon']).filter(Boolean);

  const handleSend = async () => {
    if (!message.trim()) {
      toast.error('Skriv ett meddelande');
      return;
    }
    if ((channel === 'email' || channel === 'both') && !subject.trim()) {
      toast.error('Ange ett ämne för e-post');
      return;
    }

    setSending(true);

    // TODO: Wire up actual sending via API (46elks for SMS, Resend for email)
    console.log('Sending message:', {
      channel,
      subject,
      message,
      recipients: recipients.map(r => ({
        name: `${r.form_data['Förnamn']} ${r.form_data['Efternamn']}`,
        email: r.form_data['E-post'],
        phone: r.form_data['Telefon'],
      })),
    });

    // Simulate send delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    setSending(false);
    setOpen(false);
    setMessage('');
    setSubject('');

    const channelLabel = channel === 'email' ? 'e-post' : channel === 'sms' ? 'SMS' : 'e-post + SMS';
    toast.success(`${channelLabel} skickat till ${recipients.length} mottagare`);
  };

  const filterDescription = filterLabel && filterValue
    ? `${filterValue === 'true' ? 'Ja' : filterValue === 'false' ? 'Nej' : filterValue} (${filterLabel})`
    : 'Alla deltagare';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Send className="h-4 w-4" /> Skicka meddelande ({recipients.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading">Skicka meddelande</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Recipients summary */}
          <div className="rounded-lg bg-muted p-3">
            <p className="text-sm font-medium">Mottagare</p>
            <p className="text-sm text-muted-foreground">
              {recipients.length} deltagare — {filterDescription}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{tripTitle}</p>
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
          </div>

          {/* Channel selector */}
          <div className="space-y-1.5">
            <Label className="text-sm">Kanal</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={channel === 'email' ? 'default' : 'outline'}
                size="sm"
                className="gap-1.5"
                onClick={() => setChannel('email')}
              >
                <Mail className="h-3.5 w-3.5" /> E-post ({emails.length})
              </Button>
              <Button
                type="button"
                variant={channel === 'sms' ? 'default' : 'outline'}
                size="sm"
                className="gap-1.5"
                onClick={() => setChannel('sms')}
              >
                <MessageSquare className="h-3.5 w-3.5" /> SMS ({phones.length})
              </Button>
              <Button
                type="button"
                variant={channel === 'both' ? 'default' : 'outline'}
                size="sm"
                className="gap-1.5"
                onClick={() => setChannel('both')}
              >
                Båda
              </Button>
            </div>
          </div>

          {/* Subject (email only) */}
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

          {/* Message */}
          <div className="space-y-1.5">
            <Label className="text-sm">Meddelande</Label>
            <Textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Skriv ditt meddelande här..."
              rows={5}
            />
            <p className="text-xs text-muted-foreground">
              Tips: Använd {'{förnamn}'} för att personalisera meddelandet.
            </p>
          </div>

          {/* Send button */}
          <Button onClick={handleSend} disabled={sending} className="w-full gap-2">
            {sending ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Skickar...</>
            ) : (
              <><Send className="h-4 w-4" /> Skicka till {recipients.length} mottagare</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SendMessageDialog;
