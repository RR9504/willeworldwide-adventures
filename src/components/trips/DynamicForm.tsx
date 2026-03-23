import { useState } from 'react';
import { FormField } from '@/types/trip';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';

interface DynamicFormProps {
  fields: FormField[];
  onSubmit: (data: Record<string, any>) => void;
  isSubmitting?: boolean;
}

const DynamicForm = ({ fields, onSubmit, isSubmitting }: DynamicFormProps) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [gdprAccepted, setGdprAccepted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateField = (label: string, value: any) => {
    setFormData(prev => ({ ...prev, [label]: value }));
    setErrors(prev => ({ ...prev, [label]: '' }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    fields.forEach(field => {
      if (field.required && !formData[field.label]) {
        newErrors[field.label] = 'Detta fält är obligatoriskt';
      }
      if (field.type === 'email' && formData[field.label] && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData[field.label])) {
        newErrors[field.label] = 'Ogiltig e-postadress';
      }
    });
    if (!gdprAccepted) newErrors['gdpr'] = 'Du måste godkänna villkoren';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(formData);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <CheckCircle2 className="h-16 w-16 text-primary" />
        <h3 className="font-heading text-2xl font-bold">Tack för din anmälan!</h3>
        <p className="text-muted-foreground">Vi har tagit emot din anmälan. Du kommer att få en bekräftelse via e-post.</p>
      </div>
    );
  }

  const renderField = (field: FormField) => {
    const error = errors[field.label];
    return (
      <div key={field.id} className="space-y-2">
        <Label className="text-sm font-medium">
          {field.label} {field.required && <span className="text-primary">*</span>}
        </Label>
        {field.type === 'text' || field.type === 'email' || field.type === 'phone' ? (
          <Input
            type={field.type === 'phone' ? 'tel' : field.type}
            placeholder={field.placeholder}
            value={formData[field.label] || ''}
            onChange={e => updateField(field.label, e.target.value)}
            className={error ? 'border-destructive' : ''}
          />
        ) : field.type === 'textarea' ? (
          <Textarea
            placeholder={field.placeholder}
            value={formData[field.label] || ''}
            onChange={e => updateField(field.label, e.target.value)}
            className={error ? 'border-destructive' : ''}
          />
        ) : field.type === 'select' && field.options ? (
          <Select value={formData[field.label] || ''} onValueChange={v => updateField(field.label, v)}>
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
                checked={!!formData[field.label]}
                onCheckedChange={v => updateField(field.label, v)}
              />
              <span className="text-sm">{field.label}</span>
            </div>
            {formData[field.label] && field.conditionalFields?.map((cf, idx) => (
              <div key={idx} className="ml-6 space-y-2">
                <Label className="text-sm">{cf.label} {cf.required && <span className="text-primary">*</span>}</Label>
                {cf.type === 'select' && cf.options ? (
                  <Select value={formData[cf.label] || ''} onValueChange={v => updateField(cf.label, v)}>
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
                    value={formData[cf.label] || ''}
                    onChange={e => updateField(cf.label, e.target.value)}
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
      {fields.map(renderField)}

      <div className="space-y-2 pt-4 border-t">
        <div className="flex items-start gap-2">
          <Checkbox checked={gdprAccepted} onCheckedChange={v => { setGdprAccepted(!!v); setErrors(prev => ({ ...prev, gdpr: '' })); }} className="mt-0.5" />
          <span className="text-sm text-muted-foreground">
            Jag godkänner att WilleWorldWide lagrar och behandlar mina personuppgifter i enlighet med GDPR.
          </span>
        </div>
        {errors['gdpr'] && <p className="text-xs text-destructive">{errors['gdpr']}</p>}
      </div>

      <Button type="submit" size="lg" className="w-full font-heading font-semibold" disabled={isSubmitting}>
        {isSubmitting ? 'Skickar...' : 'Skicka anmälan'}
      </Button>
    </form>
  );
};

export default DynamicForm;
