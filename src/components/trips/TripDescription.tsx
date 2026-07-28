import { Check } from 'lucide-react';

export type Block =
  | { type: 'heading'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; items: string[] };

const BULLET_RE = /^[*\-•]\s+/;
const HEADING_RE = /^##\s+/;

export function parseBlocks(raw: string): Block[] {
  let text = raw.trim();
  // Äldre beskrivningar skrevs utan radbrytningar med " * " som avdelare
  if (!text.includes('\n') && text.includes(' * ')) {
    text = text.replace(/ \* /g, '\n* ');
  }

  const lines = text.split('\n').map(l => l.trim());
  const blocks: Block[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    if (HEADING_RE.test(line)) {
      // Explicit rubrik från editorn ("## Rubrik") — alltid rubrik oavsett vad som följer
      blocks.push({ type: 'heading', text: line.replace(HEADING_RE, '') });
    } else if (BULLET_RE.test(line)) {
      const items: string[] = [];
      while (i < lines.length && BULLET_RE.test(lines[i])) {
        items.push(lines[i].replace(BULLET_RE, ''));
        i++;
      }
      i--;
      blocks.push({ type: 'list', items });
    } else if (i + 1 < lines.length && BULLET_RE.test(lines[i + 1]) && line.length <= 60 && !/[.!?]$/.test(line)) {
      blocks.push({ type: 'heading', text: line });
    } else {
      blocks.push({ type: 'paragraph', text: line });
    }
  }

  return blocks;
}

export function TripDescription({ text }: { text: string }) {
  const blocks = parseBlocks(text);

  return (
    <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
      {blocks.map((block, i) => {
        if (block.type === 'heading') {
          return <p key={i} className="font-semibold text-foreground">{block.text}</p>;
        }
        if (block.type === 'list') {
          return (
            <ul key={i} className="space-y-1.5">
              {block.items.map((item, j) => (
                <li key={j} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          );
        }
        return <p key={i}>{block.text}</p>;
      })}
    </div>
  );
}
