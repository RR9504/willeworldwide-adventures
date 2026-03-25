import { useState } from 'react';
import { FormField, FormFieldType, FormFieldOption, ConditionalField } from '@/types/trip';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2, Plus, GripVertical, ChevronDown, ChevronRight, X } from 'lucide-react';

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

const FormFieldEditor = ({ field, onChange, onRemove, dragHandleProps }: FormFieldEditorProps) => {
  const [expanded, setExpanded] = useState(true);

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

            {/* Required toggle */}
            <div className="flex items-center gap-3">
              <Switch checked={field.required} onCheckedChange={v => update({ required: v })} />
              <Label className="text-sm">Obligatoriskt fält</Label>
            </div>

            {/* Select options */}
            {field.type === 'select' && (
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Alternativ</Label>
                {(field.options || []).map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input
                      value={opt.label}
                      onChange={e => {
                        const label = e.target.value;
                        const value = label.toLowerCase().replace(/[^a-zåäö0-9]+/g, '-').replace(/-+$/, '');
                        updateOption(idx, { label, value });
                      }}
                      placeholder={`Alternativ ${idx + 1}`}
                      className="flex-1"
                    />
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeOption(idx)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addOption} className="gap-1">
                  <Plus className="h-3 w-3" /> Lägg till alternativ
                </Button>
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
                            <div key={optIdx} className="flex items-center gap-2">
                              <Input
                                value={opt.label}
                                onChange={e => {
                                  const label = e.target.value;
                                  const value = label.toLowerCase().replace(/[^a-zåäö0-9]+/g, '-').replace(/-+$/, '');
                                  updateConditionalOption(cfIdx, optIdx, { label, value });
                                }}
                                placeholder={`Alternativ ${optIdx + 1}`}
                                className="flex-1"
                              />
                              <Button type="button" variant="ghost" size="icon" onClick={() => removeConditionalOption(cfIdx, optIdx)} className="h-6 w-6 text-muted-foreground">
                                <X className="h-3 w-3" />
                              </Button>
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
