import { useRef } from 'react';
import { List, Plus, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { TripDescription } from '@/components/trips/TripDescription';

interface DescriptionEditorProps {
  value: string;
  onChange: (value: string) => void;
}

/**
 * Editor för resans beskrivning med live-förhandsvisning.
 * Formatet är enkel text: rader som börjar med * blir punktlista,
 * korta rader före en lista (t.ex. "I resan ingår") blir rubriker.
 */
const DescriptionEditor = ({ value, onChange }: DescriptionEditorProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /** Uppdaterar texten och återställer fokus + markering. */
  const apply = (next: string, selStart: number, selEnd: number) => {
    onChange(next);
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (el) {
        el.focus();
        el.setSelectionRange(selStart, selEnd);
      }
    });
  };

  /** Slår av/på "* " på alla rader som markeringen berör. */
  const toggleBullets = () => {
    const el = textareaRef.current;
    if (!el) return;
    const { selectionStart, selectionEnd } = el;

    const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
    const lineEndIdx = value.indexOf('\n', selectionEnd);
    const lineEnd = lineEndIdx === -1 ? value.length : lineEndIdx;

    const block = value.slice(lineStart, lineEnd);
    const lines = block.split('\n');
    const allBullets = lines.every(l => l.trimStart().startsWith('* ') || !l.trim());
    const newBlock = lines
      .map(l => {
        if (!l.trim()) return l;
        return allBullets ? l.replace(/^(\s*)\* /, '$1') : l.trimStart().startsWith('* ') ? l : `* ${l}`;
      })
      .join('\n');

    const next = value.slice(0, lineStart) + newBlock + value.slice(lineEnd);
    apply(next, lineStart, lineStart + newBlock.length);
  };

  /** Lägger till en sektionsmall (rubrik + tomma punkter) i slutet av texten. */
  const insertSection = (heading: string) => {
    const trimmed = value.replace(/\s+$/, '');
    const prefix = trimmed ? `${trimmed}\n\n` : '';
    const next = `${prefix}${heading}\n* `;
    apply(next, next.length, next.length);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={toggleBullets} title="Gör markerade rader till punktlista">
            <List className="h-3.5 w-3.5" /> Punktlista
          </Button>
          <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => insertSection('I resan ingår')}>
            <Plus className="h-3.5 w-3.5" /> I resan ingår
          </Button>
          <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => insertSection('Tillkommer')}>
            <Plus className="h-3.5 w-3.5" /> Tillkommer
          </Button>
        </div>
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={'Beskriv resan...\n\nI resan ingår\n* Bussresa tur och retur\n* 1 övernattning med frukost'}
          rows={16}
          className="font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground">
          Rader som börjar med * blir punktlista. En kort rad före en lista (t.ex. "I resan ingår") blir rubrik.
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex h-8 items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Eye className="h-3.5 w-3.5" /> Så här ser det ut på bokningssidan
        </div>
        <div className="rounded-lg border bg-background p-4">
          {value.trim() ? (
            <TripDescription text={value} />
          ) : (
            <p className="text-sm italic text-muted-foreground">Förhandsvisningen dyker upp när du börjar skriva.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DescriptionEditor;
