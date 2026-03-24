import { useParams } from 'react-router-dom';
import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { mockTrips, mockRegistrations } from '@/data/mockTrips';
import { toast } from 'sonner';

const PresentationFormPage = () => {
  const { id, regId } = useParams<{ id: string; regId: string }>();
  const trip = mockTrips.find(t => t.id === id);
  const reg = mockRegistrations.find(r => r.id === regId && r.trip_id === id);

  const [formData, setFormData] = useState<Record<string, string>>(
    reg?.presentation_data || {}
  );
  const [submitted, setSubmitted] = useState(false);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Save to Supabase
    console.log('Presentation data submitted:', { regId, formData });
    toast.success('Tack! Dina svar har sparats.');
    setSubmitted(true);
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
          <img
            src="https://usercontent.one/wp/www.willeworldwide.se/wp-content/uploads/2021/06/short-logo-wille-worldwide-vittext-rgb.png?media=1766889486"
            alt="WilleWorldWide"
            className="mx-auto mb-4 h-10 w-auto rounded bg-sidebar p-2"
          />
          <h1 className="font-heading text-2xl font-bold">{trip.title}</h1>
          <p className="mt-1 text-muted-foreground">
            Hej{name ? ` ${name.split(' ')[0]}` : ''}! Fyll i formuläret nedan så att dina medresenärer kan lära känna dig lite bättre.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Lär känna varandra</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {trip.presentation_fields.map(pf => (
                <div key={pf.id} className="space-y-1.5">
                  <Label className="text-sm font-medium">{pf.question}</Label>
                  {pf.type === 'textarea' ? (
                    <Textarea
                      value={formData[pf.question] || ''}
                      onChange={e => setFormData(prev => ({ ...prev, [pf.question]: e.target.value }))}
                      placeholder={pf.placeholder}
                      rows={3}
                    />
                  ) : (
                    <Input
                      value={formData[pf.question] || ''}
                      onChange={e => setFormData(prev => ({ ...prev, [pf.question]: e.target.value }))}
                      placeholder={pf.placeholder}
                    />
                  )}
                </div>
              ))}
              <Button type="submit" size="lg" className="w-full font-heading font-semibold">
                Skicka in mina svar
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>

      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} WilleWorldWide
      </footer>
    </div>
  );
};

export default PresentationFormPage;
