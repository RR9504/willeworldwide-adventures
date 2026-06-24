import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PromoCode } from '@/types/trip';

type Mode = 'none' | 'existing' | 'custom';

function initialMode(value: PromoCode | undefined, promoCodes: PromoCode[] | undefined): Mode {
  if (!value) return 'none';
  const matches = promoCodes?.some(p => p.code.trim().toLowerCase() === value.code.trim().toLowerCase());
  return matches ? 'existing' : 'custom';
}

/**
 * Admin-redigerare för rabatt på en befintlig bokning. Lagrar resultatet som ett
 * PromoCode-objekt (eller undefined) som anropas via onChange. Stödjer både resans
 * fördefinierade kampanjkoder och en fri ad-hoc-rabatt (procent eller fast belopp).
 */
export function BookingDiscountEditor({
  promoCodes,
  value,
  onChange,
}: {
  promoCodes?: PromoCode[];
  value?: PromoCode;
  onChange: (v: PromoCode | undefined) => void;
}) {
  const [mode, setMode] = useState<Mode>(() => initialMode(value, promoCodes));
  // Lokala fält för ad-hoc-läget (frikopplade från value så man kan skriva fritt)
  const [customType, setCustomType] = useState<'percent' | 'fixed'>(value?.type ?? 'percent');
  const [customValue, setCustomValue] = useState<string>(value && initialMode(value, promoCodes) === 'custom' ? String(value.value) : '');
  const [customLabel, setCustomLabel] = useState<string>(value?.label ?? '');

  const hasCodes = !!promoCodes?.length;

  const handleMode = (m: Mode) => {
    setMode(m);
    if (m === 'none') onChange(undefined);
    if (m === 'custom') emitCustom(customType, customValue, customLabel);
    // 'existing' väntar tills en kod väljs
  };

  const emitCustom = (type: 'percent' | 'fixed', val: string, label: string) => {
    const num = Number(val);
    if (!val.trim() || Number.isNaN(num) || num <= 0) {
      onChange(undefined);
      return;
    }
    onChange({ code: '', type, value: num, label: label.trim() || undefined });
  };

  return (
    <div className="space-y-3 rounded-lg border border-dashed p-3">
      <Label className="text-sm font-medium">Rabatt</Label>

      <Select value={mode} onValueChange={v => handleMode(v as Mode)}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Ingen rabatt</SelectItem>
          <SelectItem value="existing" disabled={!hasCodes}>
            Befintlig kampanjkod{!hasCodes ? ' (inga på resan)' : ''}
          </SelectItem>
          <SelectItem value="custom">Egen rabatt</SelectItem>
        </SelectContent>
      </Select>

      {mode === 'existing' && hasCodes && (
        <Select
          value={value?.code ?? ''}
          onValueChange={code => {
            const found = promoCodes!.find(p => p.code === code);
            if (found) onChange({ ...found });
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Välj kampanjkod..." />
          </SelectTrigger>
          <SelectContent>
            {promoCodes!.map(p => (
              <SelectItem key={p.code} value={p.code}>
                {p.code}
                {p.label ? ` – ${p.label}` : ''} ({p.type === 'percent' ? `${p.value}%` : `${p.value} kr`})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {mode === 'custom' && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Select
              value={customType}
              onValueChange={v => {
                const t = v as 'percent' | 'fixed';
                setCustomType(t);
                emitCustom(t, customValue, customLabel);
              }}
            >
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percent">Procent</SelectItem>
                <SelectItem value="fixed">Fast belopp</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative flex-1">
              <Input
                type="number"
                min={0}
                placeholder={customType === 'percent' ? 't.ex. 10' : 't.ex. 500'}
                value={customValue}
                onChange={e => {
                  setCustomValue(e.target.value);
                  emitCustom(customType, e.target.value, customLabel);
                }}
                className="pr-12"
              />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
                {customType === 'percent' ? '%' : 'kr'}
              </span>
            </div>
          </div>
          <Input
            placeholder="Notering (valfritt), t.ex. Jobbar på resan"
            value={customLabel}
            onChange={e => {
              setCustomLabel(e.target.value);
              emitCustom(customType, customValue, e.target.value);
            }}
          />
        </div>
      )}
    </div>
  );
}
