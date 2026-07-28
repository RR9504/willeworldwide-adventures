import { useState } from 'react';
import { ArrowDown, ArrowUp, Check, Eye, Heading2, List, Pilcrow, Plus, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { TripDescription, parseBlocks, Block } from '@/components/trips/TripDescription';

interface DescriptionEditorProps {
  value: string;
  onChange: (value: string) => void;
}

interface EditorBlock {
  id: string;
  block: Block;
}

let blockCounter = 0;
const newId = () => `block-${++blockCounter}`;

/** Serialiserar blocken till textformatet som TripDescription renderar. */
export function serializeBlocks(blocks: Block[]): string {
  return blocks
    .map(b => {
      if (b.type === 'heading') return b.text.trim() ? `## ${b.text.trim()}` : '';
      if (b.type === 'list') return b.items.filter(i => i.trim()).map(i => `* ${i.trim()}`).join('\n');
      return b.text.trim();
    })
    .filter(Boolean)
    .join('\n\n');
}

/**
 * Blockeditor för resans beskrivning: rubriker, stycken och punktlistor
 * som byggblock, med live-förhandsvisning av bokningssidans rendering.
 * Sparas som enkel text (## rubrik, * punkt) i befintliga description-fältet.
 */
const DescriptionEditor = ({ value, onChange }: DescriptionEditorProps) => {
  const [blocks, setBlocks] = useState<EditorBlock[]>(() =>
    parseBlocks(value).map(block => ({ id: newId(), block })),
  );
  const [focusKey, setFocusKey] = useState<string | null>(null);

  const update = (next: EditorBlock[]) => {
    setBlocks(next);
    onChange(serializeBlocks(next.map(b => b.block)));
  };

  const setBlock = (id: string, block: Block) => update(blocks.map(b => (b.id === id ? { ...b, block } : b)));
  const removeBlock = (id: string) => update(blocks.filter(b => b.id !== id));

  const moveBlock = (id: string, dir: -1 | 1) => {
    const i = blocks.findIndex(b => b.id === id);
    const j = i + dir;
    if (j < 0 || j >= blocks.length) return;
    const next = [...blocks];
    [next[i], next[j]] = [next[j], next[i]];
    update(next);
  };

  const addBlock = (block: Block) => {
    const entry = { id: newId(), block };
    update([...blocks, entry]);
    setFocusKey(block.type === 'list' ? `${entry.id}-0` : entry.id);
  };

  const setListItem = (b: EditorBlock, index: number, text: string) => {
    if (b.block.type !== 'list') return;
    const items = [...b.block.items];
    items[index] = text;
    setBlock(b.id, { ...b.block, items });
  };

  const addListItem = (b: EditorBlock, after: number) => {
    if (b.block.type !== 'list') return;
    const items = [...b.block.items];
    items.splice(after + 1, 0, '');
    setBlock(b.id, { ...b.block, items });
    setFocusKey(`${b.id}-${after + 1}`);
  };

  const removeListItem = (b: EditorBlock, index: number) => {
    if (b.block.type !== 'list') return;
    const items = b.block.items.filter((_, i) => i !== index);
    if (items.length === 0) removeBlock(b.id);
    else setBlock(b.id, { ...b.block, items });
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-2">
        {blocks.map((b, i) => {
          const blk = b.block;
          return (
          <div key={b.id} className="group flex items-start gap-2 rounded-lg border bg-background p-3">
            <div className="min-w-0 flex-1">
              {blk.type === 'heading' && (
                <Input
                  value={blk.text}
                  autoFocus={focusKey === b.id}
                  onChange={e => setBlock(b.id, { type: 'heading', text: e.target.value })}
                  placeholder="Rubrik, t.ex. I resan ingår"
                  className="border-0 px-0 font-heading text-base font-bold shadow-none focus-visible:ring-0"
                />
              )}
              {blk.type === 'paragraph' && (
                <Textarea
                  value={blk.text}
                  autoFocus={focusKey === b.id}
                  onChange={e => setBlock(b.id, { type: 'paragraph', text: e.target.value })}
                  placeholder="Skriv ett stycke..."
                  rows={Math.max(2, Math.ceil(blk.text.length / 70))}
                  className="min-h-0 resize-none border-0 px-0 text-sm shadow-none focus-visible:ring-0"
                />
              )}
              {blk.type === 'list' && (
                <div className="space-y-1">
                  {blk.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Check className="h-4 w-4 shrink-0 text-primary" />
                      <Input
                        value={item}
                        autoFocus={focusKey === `${b.id}-${idx}`}
                        onChange={e => setListItem(b, idx, e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addListItem(b, idx);
                          } else if (e.key === 'Backspace' && !item) {
                            e.preventDefault();
                            removeListItem(b, idx);
                          }
                        }}
                        placeholder="Punkt..."
                        className="h-8 border-0 px-0 text-sm shadow-none focus-visible:ring-0"
                      />
                      <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100" onClick={() => removeListItem(b, idx)} title="Ta bort punkt">
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="ghost" size="sm" className="h-7 gap-1.5 px-1 text-xs text-muted-foreground" onClick={() => addListItem(b, blk.items.length - 1)}>
                    <Plus className="h-3.5 w-3.5" /> Lägg till punkt
                  </Button>
                </div>
              )}
            </div>

            <div className="flex shrink-0 flex-col gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
              <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" disabled={i === 0} onClick={() => moveBlock(b.id, -1)} title="Flytta upp">
                <ArrowUp className="h-3.5 w-3.5" />
              </Button>
              <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" disabled={i === blocks.length - 1} onClick={() => moveBlock(b.id, 1)} title="Flytta ner">
                <ArrowDown className="h-3.5 w-3.5" />
              </Button>
              <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeBlock(b.id)} title="Ta bort block">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          );
        })}

        <div className="flex flex-wrap gap-1.5 pt-1">
          <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => addBlock({ type: 'heading', text: '' })}>
            <Heading2 className="h-3.5 w-3.5" /> Rubrik
          </Button>
          <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => addBlock({ type: 'paragraph', text: '' })}>
            <Pilcrow className="h-3.5 w-3.5" /> Stycke
          </Button>
          <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => addBlock({ type: 'list', items: [''] })}>
            <List className="h-3.5 w-3.5" /> Punktlista
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex h-8 items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Eye className="h-3.5 w-3.5" /> Så här ser det ut på bokningssidan
        </div>
        <div className="rounded-lg border bg-background p-4">
          {value.trim() ? (
            <TripDescription text={value} />
          ) : (
            <p className="text-sm italic text-muted-foreground">Lägg till en rubrik, ett stycke eller en punktlista för att komma igång.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DescriptionEditor;
