import { useState, useRef } from 'react';
import { Send, Mail, MessageSquare, Loader2, Paperclip, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Registration } from '@/types/trip';
import { sendMessage } from '@/lib/messaging';
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
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    try {
      const result = await sendMessage({
        channel,
        subject,
        message,
        recipients: recipients.map(r => ({
          name: `${r.form_data['Förnamn'] || ''} ${r.form_data['Efternamn'] || ''}`.trim(),
          email: r.form_data['E-post'] || undefined,
          phone: r.form_data['Telefon'] || undefined,
        })),
      });

      if (result.success) {
        const channelLabel = channel === 'email' ? 'E-post' : channel === 'sms' ? 'SMS' : 'E-post + SMS';
        toast.success(`${channelLabel} skickat till ${recipients.length} mottagare`);
        setOpen(false);
        setMessage('');
        setSubject('');
        setFiles([]);
      } else {
        toast.error(result.error || 'Kunde inte skicka meddelandet');
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

          {/* File attachments */}
          {(channel === 'email' || channel === 'both') && (
            <div className="space-y-2">
              <Label className="text-sm">Bifoga filer</Label>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={e => {
                  if (e.target.files) setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
                }}
              />
              <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => fileInputRef.current?.click()}>
                <Paperclip className="h-3.5 w-3.5" /> Välj fil
              </Button>
              {files.length > 0 && (
                <div className="space-y-1">
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center justify-between rounded bg-muted px-2 py-1 text-sm">
                      <span className="truncate">{f.name} <span className="text-muted-foreground">({(f.size / 1024).toFixed(0)} KB)</span></span>
                      <button onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))} className="ml-2 text-muted-foreground hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

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
