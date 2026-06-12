import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { CheckCircle2, Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EditableFormField } from '@/components/trips/EditableFormField';
import { useTrip, useRegistrations, useUpdateRegistration } from '@/hooks/useTrips';
import { toast } from 'sonner';

// Publik länk för kunden att komplettera/uppdatera sin anmälan.
// Pre-fyller med befintliga svar; ingen GDPR-prompt eller pristotal — det här är "komplettera" inte "anmäla".
const RegistrationEditPage = () => {
  const { id, regId } = useParams<{ id: string; regId: string }>();
  const { data: trip, isLoading: tripLoading } = useTrip(id);
  const { data: registrations = [], isLoading: regsLoading } = useRegistrations(id);
  const reg = registrations.find(r => r.id === regId);
  const updateRegistration = useUpdateRegistration();
  const [draft, setDraft] = useState<Record<string, any>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (reg?.form_data) setDraft({ ...reg.form_data });
  }, [reg]);

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
      await updateRegistration.mutateAsync({ id: reg.id, form_data: draft });
      toast.success('Tack! Dina uppgifter är sparade.');
      setSaved(true);
    } catch (err) {
      toast.error(`Kunde inte spara: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  if (saved) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <CheckCircle2 className="h-16 w-16 text-primary" />
          <h2 className="font-heading text-2xl font-bold">Tack{name ? ` ${name.split(' ')[0]}` : ''}!</h2>
          <p className="text-muted-foreground">Dina uppgifter har sparats.</p>
          <Button variant="outline" size="sm" onClick={() => setSaved(false)}>Ändra fler uppgifter</Button>
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
          <p className="mt-1 text-muted-foreground">
            Hej{name ? ` ${name.split(' ')[0]}` : ''}! Här kan du uppdatera eller komplettera dina anmälningsuppgifter.
          </p>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-lg">Dina uppgifter</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {trip.form_fields.map(field => (
                <EditableFormField
                  key={field.id}
                  field={field}
                  data={draft}
                  onUpdate={(label, value) => setDraft(prev => ({ ...prev, [label]: value }))}
                  showDescription
                />
              ))}
              <Button type="submit" size="lg" className="w-full gap-2 font-heading font-semibold" disabled={updateRegistration.isPending}>
                {updateRegistration.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                Spara
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default RegistrationEditPage;
