import { useParams } from 'react-router-dom';
import { useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTrip, useRegistrations, useUpdateRegistration } from '@/hooks/useTrips';
import { toast } from 'sonner';

const PresentationFormPage = () => {
  const { id, regId } = useParams<{ id: string; regId: string }>();
  const { data: trip, isLoading: tripLoading } = useTrip(id);
  const { data: registrations = [], isLoading: regsLoading } = useRegistrations(id);
  const reg = registrations.find(r => r.id === regId);
  const updateRegistration = useUpdateRegistration();

  const [formData, setFormData] = useState<Record<string, string>>(reg?.presentation_data || {});
  const [submitted, setSubmitted] = useState(false);

  // Update formData when reg loads
  if (reg?.presentation_data && Object.keys(formData).length === 0 && Object.keys(reg.presentation_data).length > 0) {
    setFormData(reg.presentation_data);
  }

  if (tripLoading || regsLoading) {
    return (<div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>);
  }

  if (!trip || !reg) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="font-heading text-2xl font-bold">Länken är ogiltig</h1>
          <p className="mt-2 text-muted-foreground">Kontrollera att du fått rätt länk från arrangören.</p>
        </div>
      </div>
    );
  }

  const name = `${reg.form_data['Förnamn'] || ''} ${reg.form_data['Efternamn'] || ''}`.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateRegistration.mutateAsync({ id: reg.id, presentation_data: formData });
      toast.success('Tack! Dina svar har sparats.');
      setSubmitted(true);
    } catch {
      toast.error('Något gick fel. Försök igen.');
    }
  };

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <CheckCircle2 className="h-16 w-16 text-primary" />
          <h2 className="font-heading text-2xl font-bold">Tack{name ? ` ${name.split(' ')[0]}` : ''}!</h2>
          <p className="text-muted-foreground">Dina svar har sparats. Vi ser fram emot resan!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <main className="container max-w-2xl flex-1 py-8">
        <div className="mb-6 text-center">
          <img src="https://usercontent.one/wp/www.willeworldwide.se/wp-content/uploads/2021/06/short-logo-wille-worldwide-vittext-rgb.png?media=1766889486" alt="Wille Worldwide" className="mx-auto mb-4 h-10 w-auto rounded bg-sidebar p-2" />
          <h1 className="font-heading text-2xl font-bold">{trip.title}</h1>
          <p className="mt-1 text-muted-foreground">Hej{name ? ` ${name.split(' ')[0]}` : ''}! Fyll i formuläret nedan så att dina medresenärer kan lära känna dig lite bättre.</p>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-lg">Lär känna varandra</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {trip.presentation_fields.map(pf => (
                <div key={pf.id} className="space-y-1.5">
                  <Label className="text-sm font-medium">{pf.question}</Label>
                  {pf.type === 'textarea' ? (
                    <Textarea value={formData[pf.question] || ''} onChange={e => setFormData(prev => ({ ...prev, [pf.question]: e.target.value }))} placeholder={pf.placeholder} rows={3} />
                  ) : (
                    <Input value={formData[pf.question] || ''} onChange={e => setFormData(prev => ({ ...prev, [pf.question]: e.target.value }))} placeholder={pf.placeholder} />
                  )}
                </div>
              ))}
              <Button type="submit" size="lg" className="w-full font-heading font-semibold" disabled={updateRegistration.isPending}>
                {updateRegistration.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Skicka in mina svar'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
      <footer className="border-t py-6 text-center text-xs text-muted-foreground">© {new Date().getFullYear()} Wille Worldwide</footer>
    </div>
  );
};

export default PresentationFormPage;
