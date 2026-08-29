import { useState } from 'react';
import { FormField, FormFieldType, FormFieldOption, ConditionalField } from '@/types/trip';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2, Plus, GripVertical, ChevronDown, ChevronRight, X, AlertTriangle } from 'lucide-react';
import { parseSignedPriceInLabel, stripPriceFromLabel, slugifyOptionValue } from '@/lib/messaging';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const fieldTypeLabels: Record<FormFieldType, string> = {
  text: 'Text',
  email: 'E-post',
  phone: 'Telefon',
  textarea: 'Textruta',
  select: 'Dropdown',
  checkbox: 'Kryssruta',
};

interface FormFieldEditorProps {
  field: FormField;
  onChange: (field: FormField) => void;
  onRemove: () => void;
  dragHandleProps?: Record<string, any>;
}

// Varning när priset står i alternativets text men prisrutan är tom — då räknas det
// aldrig in i slutpriset. Ett klick flyttar över beloppet dit det faktiskt används.
const PriceInLabelHint = ({ option, onApply }: { option: FormFieldOption; onApply: (amount: number, currency: string, label: string) => void }) => {
  if (option.priceTbd || option.priceModifier !== undefined) return null;
  const parsed = parseSignedPriceInLabel(option.label);
  if (!parsed) return null;

  return (
    <div className="ml-6 flex flex-wrap items-center gap-2 rounded-md border border-yellow-400 bg-yellow-50 px-2 py-1.5 text-xs text-yellow-800">
      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
      <span>Priset står bara i texten och räknas inte in i slutpriset.</span>
      <button
        type="button"
        onClick={() => onApply(parsed.amount, parsed.currency, stripPriceFromLabel(option.label))}
        className="rounded bg-yellow-800 px-2 py-0.5 font-medium text-yellow-50 hover:bg-yellow-900"
      >
        Använd {parsed.amount.toLocaleString('sv-SE')} {parsed.currency}
      </button>
    </div>
  );
};

const SortableOption = ({ id, children }: { id: string; children: (handleProps: Record<string, any>) => React.ReactNode }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  return <div ref={setNodeRef} style={style} {...attributes}>{children(listeners ?? {})}</div>;
};

const FormFieldEditor = ({ field, onChange, onRemove, dragHandleProps }: FormFieldEditorProps) => {
  const [expanded, setExpanded] = useState(true);
  const optionSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleOptionDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const options = field.options || [];
    const oldIndex = options.findIndex((_, i) => `opt-${i}` === active.id);
    const newIndex = options.findIndex((_, i) => `opt-${i}` === over.id);
    if (oldIndex !== -1 && newIndex !== -1) {
      update({ options: arrayMove(options, oldIndex, newIndex) });
    }
  };

  const update = (partial: Partial<FormField>) => {
    onChange({ ...field, ...partial });
  };

  const updateOption = (idx: number, partial: Partial<FormFieldOption>) => {
    const options = [...(field.options || [])];
    options[idx] = { ...options[idx], ...partial };
    update({ options });
  };

  const addOption = () => {
    const options = [...(field.options || []), { label: '', value: '' }];
    update({ options });
  };

  const removeOption = (idx: number) => {
    const options = (field.options || []).filter((_, i) => i !== idx);
    update({ options });
  };

  const addConditionalField = () => {
    const conditionalFields: ConditionalField[] = [
      ...(field.conditionalFields || []),
      { type: 'text', label: '', required: false },
    ];
    update({ conditionalFields });
  };

  const updateConditionalField = (idx: number, partial: Partial<ConditionalField>) => {
    const conditionalFields = [...(field.conditionalFields || [])];
    conditionalFields[idx] = { ...conditionalFields[idx], ...partial };
    update({ conditionalFields });
  };

  const removeConditionalField = (idx: number) => {
    const conditionalFields = (field.conditionalFields || []).filter((_, i) => i !== idx);
    update({ conditionalFields });
  };

  const updateConditionalOption = (cfIdx: number, optIdx: number, partial: Partial<FormFieldOption>) => {
    const conditionalFields = [...(field.conditionalFields || [])];
    const options = [...(conditionalFields[cfIdx].options || [])];
    options[optIdx] = { ...options[optIdx], ...partial };
    conditionalFields[cfIdx] = { ...conditionalFields[cfIdx], options };
    update({ conditionalFields });
  };

  const addConditionalOption = (cfIdx: number) => {
    const conditionalFields = [...(field.conditionalFields || [])];
    const options = [...(conditionalFields[cfIdx].options || []), { label: '', value: '' }];
    conditionalFields[cfIdx] = { ...conditionalFields[cfIdx], options };
    update({ conditionalFields });
  };

  const removeConditionalOption = (cfIdx: number, optIdx: number) => {
    const conditionalFields = [...(field.conditionalFields || [])];
    const options = (conditionalFields[cfIdx].options || []).filter((_, i) => i !== optIdx);
    conditionalFields[cfIdx] = { ...conditionalFields[cfIdx], options };
    update({ conditionalFields });
  };

  return (
    <Card className="border-l-4 border-l-primary/30">
      <CardContent className="p-4">
        {/* Header row */}
        <div className="flex items-center gap-2">
          <div {...dragHandleProps} className="cursor-grab text-muted-foreground hover:text-foreground">
            <GripVertical className="h-5 w-5" />
          </div>
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-sm font-medium"
          >
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            <span className="font-heading">{field.label || 'Nytt fält'}</span>
          </button>
          <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {fieldTypeLabels[field.type]}
          </span>
          {field.required && (
            <span className="rounded bg-primary/10 px-2 py-0.5 text-xs text-primary">Obligatoriskt</span>
          )}
          <div className="ml-auto">
            <Button type="button" variant="ghost" size="icon" onClick={onRemove} className="h-8 w-8 text-destructive hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Expanded editor */}
        {expanded && (
          <div className="mt-4 space-y-4 pl-7">
            {/* Row: type + label */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Fälttyp</Label>
                <Select value={field.type} onValueChange={(v: FormFieldType) => {
                  const partial: Partial<FormField> = { type: v };
                  if (v === 'select' && !field.options?.length) {
                    partial.options = [{ label: '', value: '' }];
                  }
                  if (v !== 'select') {
                    partial.options = undefined;
                  }
                  if (v !== 'checkbox') {
                    partial.conditionalFields = undefined;
                  }
                  update(partial);
                }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(fieldTypeLabels).map(([val, label]) => (
                      <SelectItem key={val} value={val}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Etikett</Label>
                <Input
                  value={field.label}
                  onChange={e => update({ label: e.target.value })}
                  placeholder="t.ex. Förnamn"
                />
              </div>
            </div>

            {/* Placeholder */}
            {(field.type === 'text' || field.type === 'email' || field.type === 'phone' || field.type === 'textarea') && (
              <div className="space-y-1.5">
                <Label className="text-xs">Placeholder</Label>
                <Input
                  value={field.placeholder || ''}
                  onChange={e => update({ placeholder: e.target.value })}
                  placeholder="Visas som grå text i fältet"
                />
              </div>
            )}

            {/* Description + link */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Beskrivning (visas under fältet)</Label>
                <Input
                  value={field.description || ''}
                  onChange={e => update({ description: e.target.value })}
                  placeholder="t.ex. Se info om buffé och pris"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Länk (valfri)</Label>
                <Input
                  value={field.descriptionUrl || ''}
                  onChange={e => update({ descriptionUrl: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>

            {/* Required toggle */}
            <div className="flex items-center gap-3">
              <Switch checked={field.required} onCheckedChange={v => update({ required: v })} />
              <Label className="text-sm">Obligatoriskt fält</Label>
            </div>

            {/* Select options */}
            {field.type === 'select' && (
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Alternativ</Label>
                <DndContext sensors={optionSensors} collisionDetection={closestCenter} onDragEnd={handleOptionDragEnd}>
                  <SortableContext items={(field.options || []).map((_, i) => `opt-${i}`)} strategy={verticalListSortingStrategy}>
                    {(field.options || []).map((opt, idx) => (
                      <SortableOption key={`opt-${idx}`} id={`opt-${idx}`}>
                        {(handleProps) => (
                          <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <div {...handleProps} className="cursor-grab text-muted-foreground hover:text-foreground">
                              <GripVertical className="h-4 w-4" />
                            </div>
                            <Input
                              value={opt.label}
                              onChange={e => updateOption(idx, { label: e.target.value })}
                              onBlur={e => { if (!opt.value) updateOption(idx, { value: slugifyOptionValue(e.target.value) }); }}
                              placeholder={`Alternativ ${idx + 1}`}
                              className="flex-1"
                            />
                            <Input
                              type="number"
                              value={opt.priceTbd ? '' : (opt.priceModifier ?? '')}
                              disabled={opt.priceTbd}
                              onChange={e => updateOption(idx, { priceModifier: e.target.value ? Number(e.target.value) : undefined })}
                              placeholder={opt.priceTbd ? 'senare' : '± pris'}
                              className="w-24"
                            />
                            <Select value={opt.priceModifierCurrency || 'SEK'} onValueChange={v => updateOption(idx, { priceModifierCurrency: v })}>
                              <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="SEK">SEK</SelectItem>
                                <SelectItem value="EUR">EUR</SelectItem>
                              </SelectContent>
                            </Select>
                            <button
                              type="button"
                              onClick={() => updateOption(idx, { priceTbd: !opt.priceTbd, priceModifier: opt.priceTbd ? opt.priceModifier : undefined })}
                              title="Pris meddelas senare"
                              className={`shrink-0 rounded px-2 py-1 text-xs ${opt.priceTbd ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                            >
                              Senare
                            </button>
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeOption(idx)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                          <PriceInLabelHint
                            option={opt}
                            onApply={(amount, currency, label) => updateOption(idx, { label, priceModifier: amount, priceModifierCurrency: currency })}
                          />
                          </div>
                        )}
                      </SortableOption>
                    ))}
                  </SortableContext>
                </DndContext>
                <p className="text-xs text-muted-foreground">
                  Prisrutan styr slutpriset: <span className="font-medium">500</span> för tillägg,{' '}
                  <span className="font-medium">-500</span> för rabatt. Pris som bara skrivs i alternativets text räknas inte in.
                </p>
                <Button type="button" variant="outline" size="sm" onClick={addOption} className="gap-1">
                  <Plus className="h-3 w-3" /> Lägg till alternativ
                </Button>
              </div>
            )}

            {/* Checkbox price modifier */}
            {field.type === 'checkbox' && (
              <div className="flex items-end gap-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Pristillägg vid ikryssad</Label>
                  <Input
                    type="number"
                    value={field.priceTbd ? '' : (field.priceModifier ?? '')}
                    disabled={field.priceTbd}
                    onChange={e => update({ priceModifier: e.target.value ? Number(e.target.value) : undefined })}
                    placeholder={field.priceTbd ? 'senare' : 't.ex. 500'}
                    className="w-32"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Valuta</Label>
                  <Select value={field.priceModifierCurrency || 'SEK'} onValueChange={v => update({ priceModifierCurrency: v })}>
                    <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SEK">SEK</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <button
                  type="button"
                  onClick={() => update({ priceTbd: !field.priceTbd, priceModifier: field.priceTbd ? field.priceModifier : undefined })}
                  title="Pris meddelas senare"
                  className={`shrink-0 rounded px-2 py-1.5 text-xs ${field.priceTbd ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                >
                  Meddelas senare
                </button>
              </div>
            )}

            {/* Checkbox conditional fields */}
            {field.type === 'checkbox' && (
              <div className="space-y-3 rounded-md border border-dashed p-3">
                <Label className="text-xs font-semibold">Villkorsfält (visas när ikryssad)</Label>
                {(field.conditionalFields || []).map((cf, cfIdx) => (
                  <Card key={cfIdx} className="bg-muted/50">
                    <CardContent className="space-y-3 p-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground">Underfält {cfIdx + 1}</span>
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeConditionalField(cfIdx)} className="ml-auto h-6 w-6 text-destructive">
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Typ</Label>
                          <Select value={cf.type} onValueChange={(v: FormFieldType) => {
                            const partial: Partial<ConditionalField> = { type: v };
                            if (v === 'select' && !cf.options?.length) partial.options = [{ label: '', value: '' }];
                            if (v !== 'select') partial.options = undefined;
                            updateConditionalField(cfIdx, partial);
                          }}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {Object.entries(fieldTypeLabels).filter(([k]) => k !== 'checkbox').map(([val, label]) => (
                                <SelectItem key={val} value={val}>{label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Etikett</Label>
                          <Input value={cf.label} onChange={e => updateConditionalField(cfIdx, { label: e.target.value })} placeholder="t.ex. Storlek skor" />
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Switch checked={cf.required || false} onCheckedChange={v => updateConditionalField(cfIdx, { required: v })} />
                        <Label className="text-xs">Obligatoriskt</Label>
                      </div>
                      {cf.type === 'select' && (
                        <div className="space-y-2">
                          <Label className="text-xs">Alternativ</Label>
                          {(cf.options || []).map((opt, optIdx) => (
                            <div key={optIdx} className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <Input
                                value={opt.label}
                                onChange={e => updateConditionalOption(cfIdx, optIdx, { label: e.target.value })}
                                onBlur={e => { if (!opt.value) updateConditionalOption(cfIdx, optIdx, { value: slugifyOptionValue(e.target.value) }); }}
                                placeholder={`Alternativ ${optIdx + 1}`}
                                className="flex-1"
                              />
                              <Input
                                type="number"
                                value={opt.priceTbd ? '' : (opt.priceModifier ?? '')}
                                disabled={opt.priceTbd}
                                onChange={e => updateConditionalOption(cfIdx, optIdx, { priceModifier: e.target.value ? Number(e.target.value) : undefined })}
                                placeholder={opt.priceTbd ? 'senare' : '± pris'}
                                className="w-24"
                              />
                              <Select value={opt.priceModifierCurrency || 'SEK'} onValueChange={v => updateConditionalOption(cfIdx, optIdx, { priceModifierCurrency: v })}>
                                <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="SEK">SEK</SelectItem>
                                  <SelectItem value="EUR">EUR</SelectItem>
                                </SelectContent>
                              </Select>
                              <button
                                type="button"
                                onClick={() => updateConditionalOption(cfIdx, optIdx, { priceTbd: !opt.priceTbd, priceModifier: opt.priceTbd ? opt.priceModifier : undefined })}
                                title="Pris meddelas senare"
                                className={`shrink-0 rounded px-2 py-1 text-xs ${opt.priceTbd ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                              >
                                Senare
                              </button>
                              <Button type="button" variant="ghost" size="icon" onClick={() => removeConditionalOption(cfIdx, optIdx)} className="h-6 w-6 text-muted-foreground">
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                            <PriceInLabelHint
                              option={opt}
                              onApply={(amount, currency, label) => updateConditionalOption(cfIdx, optIdx, { label, priceModifier: amount, priceModifierCurrency: currency })}
                            />
                            </div>
                          ))}
                          <Button type="button" variant="outline" size="sm" onClick={() => addConditionalOption(cfIdx)} className="gap-1 text-xs">
                            <Plus className="h-3 w-3" /> Alternativ
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addConditionalField} className="gap-1">
                  <Plus className="h-3 w-3" /> Lägg till villkorsfält
                </Button>
              </div>
            )}

            {/* Show in summary */}
            <div className="flex items-center gap-3">
              <Switch checked={field.showInSummary || false} onCheckedChange={v => update({ showInSummary: v })} />
              <Label className="text-sm">Visa i sammanställning</Label>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FormFieldEditor;
