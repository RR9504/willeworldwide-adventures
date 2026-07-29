import { useState } from 'react';
import { FormField, PresentationQuestion, PromoCode, Trip } from '@/types/trip';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { CheckCircle2, CreditCard, Smartphone, AlertTriangle, UserPlus, X, Tag } from 'lucide-react';
import { calcExtraCostsFromFormData, collectTbdLabels, findPromoCode, calcPromoDiscountSek } from '@/lib/messaging';

export interface SubmitMeta {
  extraCosts: Record<string, number>;
  dynamicTotal: number;
  otherCurrencies: [string, number][];
  tbdLabels: string[];
  // Tillämpad kampanjkod (om någon) — sparas på anmälan och styr rabatten i mejl/admin.
  promoCode?: string;
  // Lära känna-svar per person — main + en post per medresenär
  presentationData: Record<string, string>;
  companionPresentations: Record<string, string>[];
}

interface DynamicFormProps {
  fields: FormField[];
  presentationFields?: PresentationQuestion[];
  /** Returnera false (eller kasta) om sparningen misslyckas — då visas inte bekräftelsen. */
  onSubmit: (data: Record<string, any>, companions?: Record<string, any>[], meta?: SubmitMeta) => void | boolean | Promise<void | boolean>;
  isSubmitting?: boolean;
  paymentInfo?: Trip['payment_info'];
  tripPrice?: number;
  promoCodes?: PromoCode[];
}

const DynamicForm = ({ fields, presentationFields = [], onSubmit, isSubmitting, paymentInfo, tripPrice, promoCodes }: DynamicFormProps) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [presentationData, setPresentationData] = useState<Record<string, string>>({});
  const [companions, setCompanions] = useState<Record<string, any>[]>([]);
  const [companionPresentations, setCompanionPresentations] = useState<Record<string, string>[]>([]);
  const [gdprAccepted, setGdprAccepted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
  const [promoError, setPromoError] = useState('');
  const hasPromoCodes = !!promoCodes?.length;
  const hasPresentation = presentationFields.length > 0;

  const totalPeople = 1 + companions.length;

  const mergeTotals = (...maps: Record<string, number>[]): Record<string, number> => {
    const result: Record<string, number> = {};
    maps.forEach(m => Object.entries(m).forEach(([k, v]) => { result[k] = (result[k] || 0) + v; }));
    return result;
  };

  const mainModifiers = calcExtraCostsFromFormData(fields, formData);
  const companionModifiersList = companions.map(c => calcExtraCostsFromFormData(fields, c));
  const allModifiers = mergeTotals(mainModifiers, ...companionModifiersList);
  const sekModifiers = allModifiers['SEK'] || 0;
  const otherCurrencies = Object.entries(allModifiers).filter(([k]) => k !== 'SEK');
  const grossSek = (tripPrice ?? 0) * totalPeople + sekModifiers;

  // Rabatten räknas per person på (grundpris + personens SEK-tillägg), så den blir
  // konsekvent med bekräftelsemejlen som beräknas per anmälan.
  const perPersonSek = [mainModifiers, ...companionModifiersList].map(m => (tripPrice ?? 0) + (m['SEK'] || 0));
  const promoDiscount = appliedPromo ? perPersonSek.reduce((sum, sek) => sum + calcPromoDiscountSek(sek, appliedPromo), 0) : 0;
  const dynamicTotal = Math.max(0, grossSek - promoDiscount);
  const hasModifiers = Object.values(allModifiers).some(v => v > 0);

  const applyPromo = () => {
    const match = findPromoCode(promoCodes, promoInput);
    if (!match) {
      setAppliedPromo(null);
      setPromoError('Ogiltig kampanjkod');
      return;
    }
    setAppliedPromo(match);
    setPromoError('');
  };

  const clearPromo = () => {
    setAppliedPromo(null);
    setPromoInput('');
    setPromoError('');
  };

  const mainTbd = collectTbdLabels(fields, formData);
  const companionTbd = companions.flatMap(c => collectTbdLabels(fields, c));
  const tbdLabels = Array.from(new Set([...mainTbd, ...companionTbd]));

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
    setCompanionPresentations(prev => [...prev, {}]);
  };

  const removeCompanion = (index: number) => {
    setCompanions(prev => prev.filter((_, i) => i !== index));
    setCompanionPresentations(prev => prev.filter((_, i) => i !== index));
  };

  // Svaren lagras keyed på pf.question (matchar befintlig PresentationFormPage + ParticipantDetailPage).
  const updatePresentation = (pf: PresentationQuestion, value: string) => {
    setPresentationData(prev => ({ ...prev, [pf.question]: value }));
    setErrors(prev => ({ ...prev, [`pres_${pf.id}`]: '' }));
  };

  const updateCompanionPresentation = (idx: number, pf: PresentationQuestion, value: string) => {
    setCompanionPresentations(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [pf.question]: value };
      return updated;
    });
    setErrors(prev => ({ ...prev, [`companion_${idx}_pres_${pf.id}`]: '' }));
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

    // Validate presentation answers — alla frågor är obligatoriska
    presentationFields.forEach(pf => {
      if (!presentationData[pf.question]?.trim()) {
        newErrors[`pres_${pf.id}`] = 'Detta fält är obligatoriskt';
      }
    });
    companions.forEach((_, idx) => {
      presentationFields.forEach(pf => {
        if (!companionPresentations[idx]?.[pf.question]?.trim()) {
          newErrors[`companion_${idx}_pres_${pf.id}`] = 'Detta fält är obligatoriskt';
        }
      });
    });

    if (!gdprAccepted) newErrors['gdpr'] = 'Du måste godkänna villkoren';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || saving) return;
    const meta: SubmitMeta = {
      extraCosts: allModifiers,
      dynamicTotal,
      otherCurrencies,
      tbdLabels,
      promoCode: appliedPromo?.code,
      presentationData,
      companionPresentations,
    };
    // Visa bekräftelsen (med betalinfo!) först när anmälan bevisligen är sparad —
    // annars betalar kunden för en bokning som aldrig nådde databasen.
    setSaving(true);
    try {
      const result = await onSubmit(formData, companions.length > 0 ? companions : undefined, meta);
      if (result !== false) setSubmitted(true);
    } catch {
      // Sidan visar eget felmeddelande via toast.
    } finally {
      setSaving(false);
    }
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
              {promoDiscount > 0 && (
                <p className="text-sm text-yellow-700">
                  Kampanjrabatt ({appliedPromo?.code}): <span className="font-bold">−{promoDiscount.toLocaleString('sv-SE')} SEK</span>
                </p>
              )}
              <p className="text-sm text-yellow-700">
                Ditt pris{tbdLabels.length > 0 ? ` (exklusive ${tbdLabels.join(', ')})` : ''}: <span className="font-bold">{priceDisplay}</span>
              </p>
              <p className="text-sm text-yellow-700">
                {totalPeople > 1 ? (
                  <>Betala depositionen på <span className="font-bold">{totalDeposit.toLocaleString('sv-SE')} SEK</span> ({totalPeople} × {depositPerPerson.toLocaleString('sv-SE')} SEK) för att bekräfta bokningen.</>
                ) : (
                  <>Betala depositionen på <span className="font-bold">{depositPerPerson.toLocaleString('sv-SE')} SEK</span> för att bekräfta din bokning.</>
                )}
              </p>
              {(() => {
                const parts: string[] = [];
                if (remainingAfterDeposit != null && remainingAfterDeposit > 0) parts.push(`${remainingAfterDeposit.toLocaleString('sv-SE')} SEK`);
                otherCurrencies.forEach(([cur, amount]) => parts.push(`${amount.toLocaleString('sv-SE')} ${cur}`));
                const remainingStr = parts.length > 0 ? `Resterande belopp (${parts.join(' + ')})` : '';
                const tbdStr = tbdLabels.length > 0 ? `pris för ${tbdLabels.join(', ')}` : '';
                const combined = [remainingStr, tbdStr].filter(Boolean).join(' + ');
                if (!combined) return null;
                const tail = tbdLabels.length > 0 ? 'tillkommer på slutfakturan' : 'betalas senare';
                return <p className="text-xs text-yellow-600">{combined} {tail}.</p>;
              })()}
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

        {paymentInfo?.viva?.url && (
          <a href={paymentInfo.viva.url} target="_blank" rel="noopener noreferrer">
            <Button size="lg" className="gap-2 font-heading font-semibold">
              <CreditCard className="h-5 w-5" />
              {hasDeposit ? `Betala med kort (${totalDeposit.toLocaleString('sv-SE')} kr)` : 'Betala med kort'}
            </Button>
          </a>
        )}

        {paymentInfo?.note && (
          <div className="flex max-w-md items-start gap-3 rounded-lg border-2 border-yellow-400 bg-yellow-50 p-4 text-left">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-yellow-600" />
            <p className="text-sm font-medium leading-relaxed text-yellow-800">{paymentInfo.note}</p>
          </div>
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
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                  {opt.priceTbd && <span className="ml-2 text-xs text-muted-foreground">(pris meddelas senare)</span>}
                </SelectItem>
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
              <span className="text-sm">
                {field.label}
                {field.priceTbd && <span className="ml-2 text-xs text-muted-foreground">(pris meddelas senare)</span>}
              </span>
            </div>
            {data[field.label] && field.conditionalFields?.map((cf, idx) => (
              <div key={idx} className="ml-6 space-y-2">
                <Label className="text-sm">{cf.label} {cf.required && <span className="text-primary">*</span>}</Label>
                {cf.type === 'select' && cf.options ? (
                  <Select value={data[cf.label] || ''} onValueChange={v => updateFn(cf.label, v)}>
                    <SelectTrigger><SelectValue placeholder="Välj..." /></SelectTrigger>
                    <SelectContent>
                      {cf.options.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                          {opt.priceTbd && <span className="ml-2 text-xs text-muted-foreground">(pris meddelas senare)</span>}
                        </SelectItem>
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

  const renderPresentationSection = (
    pData: Record<string, string>,
    updateFn: (pf: PresentationQuestion, value: string) => void,
    errorPrefix: string,
  ) => (
    <div className="space-y-4 rounded-lg border border-primary/20 bg-primary/5 p-4">
      <div>
        <p className="font-heading font-semibold text-sm">Lära känna varandra</p>
        <p className="text-xs text-muted-foreground">Så medresenärerna kan lära känna dig lite bättre.</p>
      </div>
      {presentationFields.map(pf => {
        const errorKey = `${errorPrefix}pres_${pf.id}`;
        const error = errors[errorKey];
        return (
          <div key={pf.id} className="space-y-2">
            <Label className="text-sm font-medium">
              {pf.question} <span className="text-primary">*</span>
            </Label>
            {pf.type === 'textarea' ? (
              <Textarea
                placeholder={pf.placeholder}
                value={pData[pf.question] || ''}
                onChange={e => updateFn(pf, e.target.value)}
                className={error ? 'border-destructive' : ''}
              />
            ) : (
              <Input
                placeholder={pf.placeholder}
                value={pData[pf.question] || ''}
                onChange={e => updateFn(pf, e.target.value)}
                className={error ? 'border-destructive' : ''}
              />
            )}
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
        );
      })}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {fields.map(field => renderField(field, formData, updateField))}

      {hasPresentation && renderPresentationSection(presentationData, updatePresentation, '')}

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
          {hasPresentation && renderPresentationSection(
            companionPresentations[idx] || {},
            (pf, value) => updateCompanionPresentation(idx, pf, value),
            `companion_${idx}_`,
          )}
        </div>
      ))}

      <Button type="button" variant="outline" className="w-full gap-2" onClick={addCompanion}>
        <UserPlus className="h-4 w-4" /> Lägg till medresenär
      </Button>

      {/* Kampanjkod */}
      {hasPromoCodes && (
        <div className="space-y-2 rounded-lg border border-dashed p-4">
          <Label className="flex items-center gap-1.5 text-sm font-medium">
            <Tag className="h-4 w-4 text-primary" /> Kampanjkod
          </Label>
          {appliedPromo ? (
            <div className="flex items-center justify-between gap-2 rounded-md bg-primary/10 px-3 py-2">
              <span className="text-sm font-medium text-primary">
                {appliedPromo.code} tillämpad
                {appliedPromo.type === 'percent'
                  ? ` (−${appliedPromo.value}%)`
                  : ` (−${appliedPromo.value.toLocaleString('sv-SE')} SEK/person)`}
              </span>
              <Button type="button" variant="ghost" size="sm" className="h-7 gap-1 text-muted-foreground" onClick={clearPromo}>
                <X className="h-3.5 w-3.5" /> Ta bort
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                value={promoInput}
                onChange={e => { setPromoInput(e.target.value); setPromoError(''); }}
                placeholder="Ange kod"
                className={promoError ? 'border-destructive' : ''}
              />
              <Button type="button" variant="outline" onClick={applyPromo} disabled={!promoInput.trim()}>
                Använd
              </Button>
            </div>
          )}
          {promoError && <p className="text-xs text-destructive">{promoError}</p>}
        </div>
      )}

      {((dynamicTotal > 0 && (hasModifiers || totalPeople > 1)) || promoDiscount > 0 || tbdLabels.length > 0) && (
        <div className="rounded-lg bg-accent p-4 text-center space-y-1">
          {(dynamicTotal > 0 && (hasModifiers || totalPeople > 1)) || promoDiscount > 0 ? (
            <>
              {promoDiscount > 0 && (
                <p className="text-sm text-muted-foreground">
                  Kampanjrabatt ({appliedPromo?.code}): <span className="font-medium text-primary">−{promoDiscount.toLocaleString('sv-SE')} SEK</span>
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                {totalPeople > 1 ? `Totalt för ${totalPeople} resenärer` : 'Ditt pris'}
                {tbdLabels.length > 0 ? ` (exklusive ${tbdLabels.join(', ')})` : ''}
              </p>
              <p className="font-heading text-xl font-bold">
                {dynamicTotal.toLocaleString('sv-SE')} SEK
                {otherCurrencies.map(([cur, amount]) => (
                  <span key={cur}> + {amount.toLocaleString('sv-SE')} {cur}</span>
                ))}
              </p>
            </>
          ) : null}
          {tbdLabels.length > 0 && (
            <p className="text-xs italic text-muted-foreground">
              Pris för {tbdLabels.join(', ')} tillkommer på slutfakturan.
            </p>
          )}
          {paymentInfo?.deposit && paymentInfo.deposit > 0 && dynamicTotal > 0 && (
            <p className="text-xs text-muted-foreground">Varav deposition: {(paymentInfo.deposit * totalPeople).toLocaleString('sv-SE')} SEK</p>
          )}
        </div>
      )}

      {paymentInfo?.note && (
        <div className="flex items-start gap-3 rounded-lg border-2 border-yellow-400 bg-yellow-50 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-yellow-600" />
          <p className="text-sm font-medium leading-relaxed text-yellow-800">{paymentInfo.note}</p>
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

      <Button type="submit" size="lg" className="w-full font-heading font-semibold" disabled={isSubmitting || saving}>
        {isSubmitting || saving ? 'Skickar...' : totalPeople > 1 ? `Skicka anmälan (${totalPeople} resenärer)` : 'Skicka anmälan'}
      </Button>
    </form>
  );
};

export default DynamicForm;
