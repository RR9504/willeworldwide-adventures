import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, User, CreditCard, FileText, MessageCircle, Loader2, Receipt, Printer, CheckCircle2, Send, Mail } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Header from '@/components/layout/Header';
import { useTrip, useRegistrations, useUpdateRegistration } from '@/hooks/useTrips';
import { Button } from '@/components/ui/button';
import { PaymentStatus } from '@/types/trip';
import { sendMessage, buildOrderConfirmationEmail } from '@/lib/messaging';
import { toast } from 'sonner';

const paymentLabels: Record<PaymentStatus, string> = {
  unpaid: 'Ej betald', paid: 'Betald', partial: 'Deposition betald', refunded: 'Återbetald',
};
const paymentColors: Record<PaymentStatus, string> = {
  unpaid: 'bg-destructive/10 text-destructive',
  paid: 'bg-green-100 text-green-700',
  partial: 'bg-yellow-100 text-yellow-700',
  refunded: 'bg-muted text-muted-foreground',
};

const ParticipantDetailPage = () => {
  const { id, regId } = useParams<{ id: string; regId: string }>();
  const { data: trip, isLoading: tripLoading } = useTrip(id);
  const { data: registrations = [], isLoading: regsLoading } = useRegistrations(id);
  const reg = registrations.find(r => r.id === regId);
  const updateRegistration = useUpdateRegistration();

  if (tripLoading || regsLoading) {
    return (<div className="flex min-h-screen flex-col"><Header /><div className="flex flex-1 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></div>);
  }

  if (!trip || !reg) {
    return (<div className="flex min-h-screen flex-col"><Header /><div className="container flex flex-1 items-center justify-center"><p>Deltagaren hittades inte</p></div></div>);
  }

  const name = `${reg.form_data['Förnamn'] || ''} ${reg.form_data['Efternamn'] || ''}`.trim() || 'Okänd';
  const hasPresentationData = reg.presentation_data && Object.keys(reg.presentation_data).length > 0;

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <Header />
      <main className="container flex-1 py-8">
        <Link to={`/dashboard/resor/${trip.id}`} className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Tillbaka till {trip.title}
        </Link>

        <div className="mb-6">
          <h1 className="font-heading text-2xl font-bold">{name}</h1>
          <p className="text-sm text-muted-foreground">{trip.title} · Anmäld {new Date(reg.created_at).toLocaleDateString('sv-SE')}</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><User className="h-5 w-5 text-primary" /> Bokningsinformation</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {trip.form_fields.map(field => {
                  const val = reg.form_data[field.label];
                  const displayVal = val === true ? 'Ja' : val === false ? 'Nej' : val ?? '–';
                  return (
                    <div key={field.id} className="flex items-start justify-between gap-4">
                      <span className="text-sm text-muted-foreground">{field.label}</span>
                      <span className="text-sm font-medium text-right">{String(displayVal)}</span>
                    </div>
                  );
                })}
                {trip.form_fields
                  .filter(f => f.conditionalFields && reg.form_data[f.label])
                  .flatMap(f => f.conditionalFields || [])
                  .map((cf, idx) => {
                    const val = reg.form_data[cf.label];
                    if (!val) return null;
                    return (
                      <div key={`cf-${idx}`} className="flex items-start justify-between gap-4 pl-4 border-l-2 border-primary/20">
                        <span className="text-sm text-muted-foreground">{cf.label}</span>
                        <span className="text-sm font-medium text-right">{String(val)}</span>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><CreditCard className="h-5 w-5 text-primary" /> Betalning</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <span className="text-sm text-muted-foreground mb-2 block">Status</span>
                  <div className="flex flex-wrap gap-2">
                    {(Object.keys(paymentLabels) as PaymentStatus[]).map(status => (
                      <Button
                        key={status}
                        size="sm"
                        variant={reg.payment_status === status ? 'default' : 'outline'}
                        className={reg.payment_status === status ? paymentColors[status].replace('bg-', 'bg-').split(' ').join(' ') : ''}
                        onClick={() => {
                          updateRegistration.mutate(
                            { id: reg.id, payment_status: status },
                            { onSuccess: () => toast.success(`Betalningsstatus ändrad till "${paymentLabels[status]}"`) }
                          );
                        }}
                      >
                        {paymentLabels[status]}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Pris</span>
                  <span className="text-sm font-medium">{trip.price.toLocaleString('sv-SE')} {trip.currency}</span>
                </div>
                {reg.payment_note && (<div><span className="text-sm text-muted-foreground">Anteckning</span><p className="mt-1 text-sm">{reg.payment_note}</p></div>)}

                {/* Order confirmation */}
                {(reg.payment_status === 'paid' || reg.payment_status === 'partial') && (
                  <div className="border-t pt-3 space-y-2">
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-sm font-medium">Betalning mottagen</span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2 w-full"
                      onClick={async () => {
                        const email = reg.form_data['E-post'];
                        const phone = reg.form_data['Telefon'];
                        const firstName = reg.form_data['Förnamn'] || '';
                        const fullName = `${firstName} ${reg.form_data['Efternamn'] || ''}`.trim();
                        const { subject, message } = buildOrderConfirmationEmail(firstName, trip.title, {
                          deposit: trip.payment_info?.deposit,
                          totalPrice: trip.price,
                          isFullyPaid: reg.payment_status === 'paid',
                        });

                        const result = await sendMessage({
                          channel: email ? 'email' : 'sms',
                          recipients: [{ name: fullName, email, phone }],
                          subject,
                          message,
                        });

                        if (result.success) {
                          toast.success(`Orderbekräftelse skickad till ${email || phone}`);
                        } else {
                          toast.error('Kunde inte skicka orderbekräftelse');
                        }
                      }}
                    >
                      <Mail className="h-4 w-4" /> Skicka orderbekräftelse
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Fakturaunderlag */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg"><Receipt className="h-5 w-5 text-primary" /> Fakturaunderlag</CardTitle>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => window.print()}>
                  <Printer className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Resenär</span>
                  <span className="text-sm font-medium">{name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Resa</span>
                  <span className="text-sm font-medium">{trip.title}</span>
                </div>
                <div className="border-t pt-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Totalpris</span>
                    <span className="text-sm font-medium">{trip.price.toLocaleString('sv-SE')} {trip.currency}</span>
                  </div>
                  {reg.payment_status === 'paid' ? (
                    <div className="flex items-center justify-between border-t pt-2 text-green-600">
                      <span className="text-sm font-semibold">Helt betald</span>
                      <span className="text-sm font-bold">0 {trip.currency}</span>
                    </div>
                  ) : trip.payment_info?.deposit && trip.payment_info.deposit > 0 ? (
                    <>
                      {reg.payment_status === 'partial' ? (
                        <div className="flex items-center justify-between text-green-600">
                          <span className="text-sm">Deposition (betald)</span>
                          <span className="text-sm font-medium">−{trip.payment_info.deposit.toLocaleString('sv-SE')} {trip.currency}</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between text-yellow-600">
                          <span className="text-sm">Deposition (ej betald)</span>
                          <span className="text-sm font-medium">{trip.payment_info.deposit.toLocaleString('sv-SE')} {trip.currency}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between border-t pt-2">
                        <span className="text-sm font-semibold">Att betala</span>
                        <span className="text-sm font-bold">
                          {reg.payment_status === 'partial'
                            ? `${(trip.price - trip.payment_info.deposit).toLocaleString('sv-SE')} ${trip.currency}`
                            : `${trip.price.toLocaleString('sv-SE')} ${trip.currency}`
                          }
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-between border-t pt-2">
                      <span className="text-sm font-semibold">Att betala</span>
                      <span className="text-sm font-bold">{trip.price.toLocaleString('sv-SE')} {trip.currency}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-muted-foreground">Betalningsstatus</span>
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${paymentColors[reg.payment_status]}`}>
                    {paymentLabels[reg.payment_status]}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
          </div>

          <Card className="lg:col-span-2">
            <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><MessageCircle className="h-5 w-5 text-primary" /> Lär känna – svar</CardTitle></CardHeader>
            <CardContent>
              {hasPresentationData ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {trip.presentation_fields.map(pf => {
                    const answer = reg.presentation_data?.[pf.question];
                    if (!answer) return null;
                    return (<div key={pf.id} className="space-y-1"><p className="text-sm font-medium text-muted-foreground">{pf.question}</p><p className="text-sm">{answer}</p></div>);
                  })}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <FileText className="mx-auto h-10 w-10 text-muted-foreground/40" />
                  <p className="mt-2 text-sm text-muted-foreground">Har inte fyllt i presentationsformuläret ännu</p>
                  <p className="mt-1 text-xs text-muted-foreground">Länk: {window.location.origin}/resa/{trip.id}/presentation/{reg.id}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default ParticipantDetailPage;
