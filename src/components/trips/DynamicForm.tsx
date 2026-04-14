import { useState } from 'react';
import { FormField, Trip } from '@/types/trip';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { CheckCircle2, CreditCard, Smartphone, AlertTriangle, UserPlus, X } from 'lucide-react';

export interface SubmitMeta {
  extraCosts: Record<string, number>;
  dynamicTotal: number;
  otherCurrencies: [string, number][];
}

interface DynamicFormProps {
  fields: FormField[];
  onSubmit: (data: Record<string, any>, companions?: Record<string, any>[], meta?: SubmitMeta) => void;
  isSubmitting?: boolean;
  paymentInfo?: Trip['payment_info'];
  tripPrice?: number;
}

const DynamicForm = ({ fields, onSubmit, isSubmitting, paymentInfo, tripPrice }: DynamicFormProps) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [companions, setCompanions] = useState<Record<string, any>[]>([]);
  const [gdprAccepted, setGdprAccepted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const totalPeople = 1 + companions.length;

  const calcPriceModifiers = (data: Record<string, any>): Record<string, number> => {
    const totals: Record<string, number> = {};
    fields.forEach(field => {
      if (field.type === 'checkbox' && data[field.label] && field.priceModifier) {
        const cur = field.priceModifierCurrency || 'SEK';
        totals[cur] = (totals[cur] || 0) + field.priceModifier;
      }
      if (field.type === 'select' && field.options && data[field.label]) {
        const selected = field.options.find(o => o.value === data[field.label]);
        if (selected?.priceModifier) {
          const cur = selected.priceModifierCurrency || 'SEK';
          totals[cur] = (totals[cur] || 0) + selected.priceModifier;
        }
      }
      if (data[field.label] && field.conditionalFields) {
        field.conditionalFields.forEach(cf => {
          if (cf.options && data[cf.label]) {
            const selected = cf.options.find(o => o.value === data[cf.label]);
            if (selected?.priceModifier) {
              const cur = selected.priceModifierCurrency || 'SEK';
              totals[cur] = (totals[cur] || 0) + selected.priceModifier;
            }
          }
        });
      }
    });
    return totals;
  };

  const mergeTotals = (...maps: Record<string, number>[]): Record<string, number> => {
    const result: Record<string, number> = {};
    maps.forEach(m => Object.entries(m).forEach(([k, v]) => { result[k] = (result[k] || 0) + v; }));
    return result;
  };

  const mainModifiers = calcPriceModifiers(formData);
  const companionModifiersList = companions.map(c => calcPriceModifiers(c));
  const allModifiers = mergeTotals(mainModifiers, ...companionModifiersList);
  const sekModifiers = allModifiers['SEK'] || 0;
  const otherCurrencies = Object.entries(allModifiers).filter(([k]) => k !== 'SEK');
  const dynamicTotal = (tripPrice ?? 0) * totalPeople + sekModifiers;
  const hasModifiers = Object.values(allModifiers).some(v => v > 0);

  const updateField = (label: string, value: any) => {
    setFormData(prev => ({ ...prev, [label]: value }));
    setErrors(prev => ({ ...prev, [label]: '' }));
  };

  const updateCompanionField = (index: number, label: string, value: any) => {
    setCompanions(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [label]: value };
      return updated;
    });
    setErrors(prev => ({ ...prev, [`companion_${index}_${label}`]: '' }));
  };

  const addCompanion = () => {
    setCompanions(prev => [...prev, {}]);
  };

  const removeCompanion = (index: number) => {
    setCompanions(prev => prev.filter((_, i) => i !== index));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    // Validate main form
    fields.forEach(field => {
      if (field.required && !formData[field.label]) {
        newErrors[field.label] = 'Detta fält är obligatoriskt';
      }
      if (field.type === 'email' && formData[field.label] && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData[field.label])) {
        newErrors[field.label] = 'Ogiltig e-postadress';
      }
    });

    // Validate companions
    companions.forEach((companion, idx) => {
      fields.forEach(field => {
        if (field.required && !companion[field.label]) {
          newErrors[`companion_${idx}_${field.label}`] = 'Detta fält är obligatoriskt';
        }
        if (field.type === 'email' && companion[field.label] && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(companion[field.label])) {
          newErrors[`companion_${idx}_${field.label}`] = 'Ogiltig e-postadress';
        }
      });
    });

    if (!gdprAccepted) newErrors['gdpr'] = 'Du måste godkänna villkoren';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const meta: SubmitMeta = {
      extraCosts: allModifiers,
      dynamicTotal,
      otherCurrencies,
    };
    onSubmit(formData, companions.length > 0 ? companions : undefined, meta);
    setSubmitted(true);
  };

  if (submitted) {
    const hasDeposit = paymentInfo?.deposit && paymentInfo.deposit > 0;
    const depositPerPerson = paymentInfo?.deposit ?? 0;
    const totalDeposit = depositPerPerson * totalPeople;
    const remainingAfterDeposit = dynamicTotal && totalDeposit ? dynamicTotal - totalDeposit : undefined;

    const priceDisplay = (
      <span>
        {dynamicTotal.toLocaleString('sv-SE')} SEK
        {otherCurrencies.map(([cur, amount]) => (
          <span key={cur}> + {amount.toLocaleString('sv-SE')} {cur}</span>
        ))}
      </span>
    );

    return (
      <div className="flex flex-col items-center gap-6 py-12 text-center">
        {hasDeposit ? (
          <>
            <AlertTriangle className="h-16 w-16 text-yellow-500" />
            <h3 className="font-heading text-2xl font-bold">Nästan klar!</h3>
            <div className="rounded-lg border-2 border-yellow-400 bg-yellow-50 p-5 space-y-2 max-w-md">
              <p className="font-heading font-semibold text-lg text-yellow-800">
                {totalPeople > 1 ? 'Era anmälningar är inte giltiga' : 'Din anmälan är inte giltig'} förrän depositionen är betald
              </p>
              <p className="text-sm text-yellow-700">
                Ditt pris: <span className="font-bold">{priceDisplay}</span>
              </p>
              <p className="text-sm text-yellow-700">
                {totalPeople > 1 ? (
                  <>Betala depositionen på <span className="font-bold">{totalDeposit.toLocaleString('sv-SE')} SEK</span> ({totalPeople} × {depositPerPerson.toLocaleString('sv-SE')} SEK) för att bekräfta bokningen.</>
                ) : (
                  <>Betala depositionen på <span className="font-bold">{depositPerPerson.toLocaleString('sv-SE')} SEK</span> för att bekräfta din bokning.</>
                )}
              </p>
              {(remainingAfterDeposit != null && remainingAfterDeposit > 0 || otherCurrencies.length > 0) && (
                <p className="text-xs text-yellow-600">
                  Resterande belopp ({[
                    remainingAfterDeposit && remainingAfterDeposit > 0 ? `${remainingAfterDeposit.toLocaleString('sv-SE')} SEK` : null,
                    ...otherCurrencies.map(([cur, amount]) => `${amount.toLocaleString('sv-SE')} ${cur}`),
                  ].filter(Boolean).join(' + ')}) betalas senare.
                </p>
              )}
            </div>
          </>
        ) : (
          <>
            <CheckCircle2 className="h-16 w-16 text-primary" />
            <h3 className="font-heading text-2xl font-bold">Tack för {totalPeople > 1 ? 'era anmälningar' : 'din anmälan'}!</h3>
            <p className="text-muted-foreground">Vi har tagit emot {totalPeople > 1 ? `${totalPeople} anmälningar` : 'din anmälan'}.</p>
          </>
        )}

        {paymentInfo?.swish && (
          <div className="rounded-lg border bg-accent p-5 text-center space-y-2">
            <Smartphone className="mx-auto h-8 w-8 text-primary" />
            <p className="font-heading font-bold text-lg">Swish</p>
            <p className="text-2xl font-bold font-heading">{paymentInfo.swish.number}</p>
            <p className="text-sm text-muted-foreground">{paymentInfo.swish.name}</p>
            <p className="text-sm font-medium">
              {hasDeposit
                ? `${totalDeposit.toLocaleString('sv-SE')} SEK (deposition${totalPeople > 1 ? ` — ${totalPeople} pers` : ''})`
                : paymentInfo.swish.amount
                  ? `${(paymentInfo.swish.amount * totalPeople).toLocaleString('sv-SE')} SEK${totalPeople > 1 ? ` (${totalPeople} pers)` : ''}`
                  : ''}
            </p>
          </div>
        )}

        {paymentInfo?.viva && (
          <a href={paymentInfo.viva.url} target="_blank" rel="noopener noreferrer">
            <Button size="lg" className="gap-2 font-heading font-semibold">
              <CreditCard className="h-5 w-5" />
              {hasDeposit ? `Betala deposition (${totalDeposit.toLocaleString('sv-SE')} kr)` : 'Betala med kort'}
            </Button>
          </a>
        )}

        {paymentInfo?.note && (
          <p className="text-xs text-muted-foreground">{paymentInfo.note}</p>
        )}

        {!paymentInfo && (
          <p className="text-sm text-muted-foreground">Betalningsinformation skickas via e-post.</p>
        )}
      </div>
    );
  }

  const renderField = (field: FormField, data: Record<string, any>, updateFn: (label: string, value: any) => void, errorPrefix = '') => {
    const errorKey = errorPrefix + field.label;
    const error = errors[errorKey];
    return (
      <div key={field.id} className="space-y-2">
        <Label className="text-sm font-medium">
          {field.label} {field.required && <span className="text-primary">*</span>}
        </Label>
        {field.description && (
          <p className="text-xs text-muted-foreground">
            {field.description}
            {field.descriptionUrl && (
              <> — <a href={field.descriptionUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline hover:no-underline">Läs mer här</a></>
            )}
          </p>
        )}
        {field.type === 'text' || field.type === 'email' || field.type === 'phone' ? (
          <Input
            type={field.type === 'phone' ? 'tel' : field.type}
            placeholder={field.placeholder}
            value={data[field.label] || ''}
            onChange={e => updateFn(field.label, e.target.value)}
            className={error ? 'border-destructive' : ''}
          />
        ) : field.type === 'textarea' ? (
          <Textarea
            placeholder={field.placeholder}
            value={data[field.label] || ''}
            onChange={e => updateFn(field.label, e.target.value)}
            className={error ? 'border-destructive' : ''}
          />
        ) : field.type === 'select' && field.options ? (
          <Select value={data[field.label] || ''} onValueChange={v => updateFn(field.label, v)}>
            <SelectTrigger className={error ? 'border-destructive' : ''}>
              <SelectValue placeholder="Välj..." />
            </SelectTrigger>
            <SelectContent>
              {field.options.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : field.type === 'checkbox' ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={!!data[field.label]}
                onCheckedChange={v => updateFn(field.label, v)}
              />
              <span className="text-sm">{field.label}</span>
            </div>
            {data[field.label] && field.conditionalFields?.map((cf, idx) => (
              <div key={idx} className="ml-6 space-y-2">
                <Label className="text-sm">{cf.label} {cf.required && <span className="text-primary">*</span>}</Label>
                {cf.type === 'select' && cf.options ? (
                  <Select value={data[cf.label] || ''} onValueChange={v => updateFn(cf.label, v)}>
                    <SelectTrigger><SelectValue placeholder="Välj..." /></SelectTrigger>
                    <SelectContent>
                      {cf.options.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    placeholder={cf.placeholder}
                    value={data[cf.label] || ''}
                    onChange={e => updateFn(cf.label, e.target.value)}
                  />
                )}
              </div>
            ))}
          </div>
        ) : null}
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {fields.map(field => renderField(field, formData, updateField))}

      {/* Companions */}
      {companions.map((companion, idx) => (
        <div key={idx} className="space-y-5 rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 p-5">
          <div className="flex items-center justify-between">
            <p className="font-heading font-semibold text-sm">Medresenär {idx + 1}</p>
            <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => removeCompanion(idx)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          {fields.map(field => renderField(
            field,
            companion,
            (label, value) => updateCompanionField(idx, label, value),
            `companion_${idx}_`
          ))}
        </div>
      ))}

      <Button type="button" variant="outline" className="w-full gap-2" onClick={addCompanion}>
        <UserPlus className="h-4 w-4" /> Lägg till medresenär
      </Button>

      {tripPrice != null && tripPrice > 0 && (hasModifiers || totalPeople > 1) && (
        <div className="rounded-lg bg-accent p-4 text-center space-y-1">
          <p className="text-sm text-muted-foreground">{totalPeople > 1 ? `Totalt för ${totalPeople} resenärer` : 'Ditt pris'}</p>
          <p className="font-heading text-xl font-bold">
            {dynamicTotal.toLocaleString('sv-SE')} SEK
            {otherCurrencies.map(([cur, amount]) => (
              <span key={cur}> + {amount.toLocaleString('sv-SE')} {cur}</span>
            ))}
          </p>
          {paymentInfo?.deposit && paymentInfo.deposit > 0 && (
            <p className="text-xs text-muted-foreground">Varav deposition: {(paymentInfo.deposit * totalPeople).toLocaleString('sv-SE')} SEK</p>
          )}
        </div>
      )}

      <div className="space-y-2 pt-4 border-t">
        <div className="flex items-start gap-2">
          <Checkbox checked={gdprAccepted} onCheckedChange={v => { setGdprAccepted(!!v); setErrors(prev => ({ ...prev, gdpr: '' })); }} className="mt-0.5" />
          <span className="text-sm text-muted-foreground">
            Jag godkänner att Wille Worldwide lagrar och behandlar {totalPeople > 1 ? 'våra' : 'mina'} personuppgifter i enlighet med GDPR.
          </span>
        </div>
        {errors['gdpr'] && <p className="text-xs text-destructive">{errors['gdpr']}</p>}
      </div>

      <Button type="submit" size="lg" className="w-full font-heading font-semibold" disabled={isSubmitting}>
        {isSubmitting ? 'Skickar...' : totalPeople > 1 ? `Skicka anmälan (${totalPeople} resenärer)` : 'Skicka anmälan'}
      </Button>
    </form>
  );
};

export default DynamicForm;
