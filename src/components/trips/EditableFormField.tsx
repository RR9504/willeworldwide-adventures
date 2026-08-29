import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { FormField, ConditionalField } from '@/types/trip';
import { findOptionForValue } from '@/lib/messaging';

interface Props {
  field: FormField | (ConditionalField & { id?: string });
  data: Record<string, any>;
  onUpdate: (label: string, value: any) => void;
  /** Visa fältets beskrivning + länk under etiketten (bara FormField har dessa). */
  showDescription?: boolean;
}

// Renderar en redigerbar form-fält-rad — input-typ matchar fältets type.
// Används både i admin (ParticipantDetailPage) och i kundens redigeringslänk.
export const EditableFormField = ({ field, data, onUpdate, showDescription }: Props) => {
  const v = data[field.label];
  let control: React.ReactNode = null;

  if (field.type === 'select' && field.options) {
    // Visa rätt alternativ som valt även när svaret sparades mot ett äldre värde —
    // annars ser rutan tom ut och en sparning skulle radera valet.
    const selected = findOptionForValue(field.options, v);
    control = (
      <Select value={selected?.value ?? ''} onValueChange={value => onUpdate(field.label, value)}>
        <SelectTrigger><SelectValue placeholder="Välj…" /></SelectTrigger>
        <SelectContent>
          {field.options.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
        </SelectContent>
      </Select>
    );
  } else if (field.type === 'textarea') {
    control = <Textarea placeholder={field.placeholder} value={v || ''} onChange={e => onUpdate(field.label, e.target.value)} />;
  } else if (field.type === 'checkbox') {
    control = (
      <div className="flex items-center gap-2">
        <Checkbox checked={!!v} onCheckedChange={c => onUpdate(field.label, !!c)} />
        <span className="text-sm text-muted-foreground">{v ? 'Ja' : 'Nej'}</span>
      </div>
    );
  } else {
    control = (
      <Input
        type={field.type === 'phone' ? 'tel' : field.type === 'email' ? 'email' : 'text'}
        placeholder={field.placeholder}
        value={v ?? ''}
        onChange={e => onUpdate(field.label, e.target.value)}
      />
    );
  }

  // Visa villkorade underfält när moderkryssrutan är ikryssad.
  const subfields = field.type === 'checkbox' && v && 'conditionalFields' in field && field.conditionalFields
    ? field.conditionalFields
    : [];

  // Beskrivning + ev. länk under etiketten (bara FormField har dessa).
  const description = showDescription && 'description' in field ? field.description : undefined;
  const descriptionUrl = showDescription && 'descriptionUrl' in field ? field.descriptionUrl : undefined;

  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{field.label}</Label>
      {description && (
        <p className="text-xs text-muted-foreground">
          {description}
          {descriptionUrl && (
            <> — <a href={descriptionUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline hover:no-underline">Läs mer här</a></>
          )}
        </p>
      )}
      {control}
      {subfields.length > 0 && (
        <div className="ml-3 mt-2 space-y-3 border-l-2 border-primary/20 pl-3">
          {subfields.map((cf, idx) => (
            <EditableFormField key={cf.label || idx} field={cf} data={data} onUpdate={onUpdate} />
          ))}
        </div>
      )}
    </div>
  );
};
