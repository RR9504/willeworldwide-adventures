import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { ArrowLeft, User, CreditCard, FileText, MessageCircle, Loader2, Receipt, Printer, CheckCircle2, Send, Mail, Trash2, Pencil, Save, X, Copy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import Header from '@/components/layout/Header';
import { useTrip, useRegistrations, useUpdateRegistration, useDeleteRegistration } from '@/hooks/useTrips';
import { Button } from '@/components/ui/button';
import { PaymentStatus, PromoCode } from '@/types/trip';
import { EditableFormField } from '@/components/trips/EditableFormField';
import { BookingDiscountEditor } from '@/components/trips/BookingDiscountEditor';
import { sendMessage, buildOrderConfirmationEmail, calcExtraCostsFromFormData, collectTbdLabels, findPromoCode, calcPromoDiscountSek, formatCurrencyDelta, findOptionForValue } from '@/lib/messaging';
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
  const navigate = useNavigate();
  const { data: trip, isLoading: tripLoading } = useTrip(id);
  const { data: registrations = [], isLoading: regsLoading } = useRegistrations(id);
  const reg = registrations.find(r => r.id === regId);
  const updateRegistration = useUpdateRegistration();
  const deleteRegistration = useDeleteRegistration();
  const [editingBooking, setEditingBooking] = useState(false);
  const [bookingDraft, setBookingDraft] = useState<Record<string, any>>({});
  const [editingPresentation, setEditingPresentation] = useState(false);
  const [presentationDraft, setPresentationDraft] = useState<Record<string, string>>({});

  if (tripLoading || regsLoading) {
    return (<div className="flex min-h-screen flex-col"><Header /><div className="flex flex-1 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></div>);
  }

  if (!trip || !reg) {
    return (<div className="flex min-h-screen flex-col"><Header /><div className="container flex flex-1 items-center justify-center"><p>Deltagaren hittades inte</p></div></div>);
  }

  const name = `${reg.form_data['Förnamn'] || ''} ${reg.form_data['Efternamn'] || ''}`.trim() || 'Okänd';
  const hasPresentationData = reg.presentation_data && Object.keys(reg.presentation_data).length > 0;

  // Slutpris = grundpris + prismodifierare från valda alternativ (t.ex. hotell) − ev. kampanjrabatt
  const extraCosts = calcExtraCostsFromFormData(trip.form_fields, reg.form_data);
  const otherCurrencies = Object.entries(extraCosts).filter(([k, v]) => k !== 'SEK' && v !== 0);
  const grossSek = trip.price + (extraCosts['SEK'] || 0);
  // Admin-satt rabatt (_promo_override) tar precedens över kundens egen kampanjkod.
  const promoOverride = reg.form_data['_promo_override'] as PromoCode | undefined;
  const promo = promoOverride ?? findPromoCode(trip.promo_codes, reg.form_data['_promo_code']);
  const promoDiscount = calcPromoDiscountSek(grossSek, promo);
  const totalSek = Math.max(0, grossSek - promoDiscount);
  const tbdLabels = collectTbdLabels(trip.form_fields, reg.form_data);
  const formatPrice = (sek: number) =>
    [`${sek.toLocaleString('sv-SE')} ${trip.currency}`, ...otherCurrencies.map(([cur, amount]) => formatCurrencyDelta(amount, cur))].join(' ');


  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <Header />
      <main className="container flex-1 py-8">
        <Link to={`/dashboard/resor/${trip.id}`} className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Tillbaka till {trip.title}
        </Link>

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold">{name}</h1>
            <p className="text-sm text-muted-foreground">{trip.title} · Anmäld {new Date(reg.created_at).toLocaleDateString('sv-SE')}</p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 text-destructive hover:text-destructive" disabled={deleteRegistration.isPending}>
                {deleteRegistration.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Ta bort anmälan
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Ta bort anmälan?</AlertDialogTitle>
                <AlertDialogDescription>
                  Anmälan från <strong>{name}</strong> tas bort permanent — inklusive lära känna-svar och betalningsstatus. Detta går inte att ångra.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Avbryt</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={async () => {
                    try {
                      await deleteRegistration.mutateAsync(reg.id);
                      toast.success('Anmälan är borttagen');
                      navigate(`/dashboard/resor/${trip.id}`);
                    } catch {
                      toast.error('Kunde inte ta bort anmälan');
                    }
                  }}
                >
                  Ja, ta bort
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-col gap-3 space-y-0 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="flex items-center gap-2 text-lg"><User className="h-5 w-5 text-primary" /> Bokningsinformation</CardTitle>
              {!editingBooking ? (
                <div className="flex flex-wrap gap-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5"
                    title="Kopiera länken till anmälningsformuläret — skicka via SMS/WhatsApp/mejl"
                    onClick={() => {
                      const link = `${window.location.origin}/resa/${trip.id}/anmalan/${reg.id}`;
                      navigator.clipboard.writeText(link);
                      toast.success('Länk kopierad');
                    }}
                  >
                    <Copy className="h-3.5 w-3.5" /> Kopiera länk
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => { setBookingDraft({ ...reg.form_data }); setEditingBooking(true); }}
                  >
                    <Pencil className="h-3.5 w-3.5" /> Redigera
                  </Button>
                </div>
              ) : (
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setEditingBooking(false)} disabled={updateRegistration.isPending}>
                    <X className="h-3.5 w-3.5" /> Avbryt
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    className="gap-1.5"
                    disabled={updateRegistration.isPending}
                    onClick={async () => {
                      try {
                        await updateRegistration.mutateAsync({ id: reg.id, form_data: bookingDraft });
                        toast.success('Bokningsuppgifter uppdaterade');
                        setEditingBooking(false);
                      } catch (err) {
                        toast.error(`Kunde inte spara: ${err instanceof Error ? err.message : String(err)}`);
                      }
                    }}
                  >
                    {updateRegistration.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Spara
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {!editingBooking ? (
                <div className="space-y-3">
                  {trip.form_fields.map(field => {
                    const val = reg.form_data[field.label];
                    // Visa option-etikett istället för dess interna "value"
                    const labelFromOption = field.type === 'select' ? findOptionForValue(field.options, val)?.label : undefined;
                    const displayVal = val === true ? 'Ja' : val === false ? 'Nej' : (labelFromOption ?? val ?? '–');
                    return (
                      <div key={field.id} className="flex items-start justify-between gap-4">
                        <span className="text-sm text-muted-foreground">{field.label}</span>
                        <span className="text-sm font-medium text-right">{String(displayVal)}</span>
                      </div>
                    );
                  })}
                  {trip.form_fields
                    .filter(f => f.conditionalFields && reg.form_data[f.label])
                    .flatMap(f => (f.conditionalFields || []).map(cf => ({ cf, parent: f })))
                    .map(({ cf, parent }, idx) => {
                      const val = reg.form_data[cf.label];
                      if (!val) return null;
                      const labelFromOption = cf.type === 'select' ? findOptionForValue(cf.options, val)?.label : undefined;
                      return (
                        <div key={`cf-${parent.id}-${idx}`} className="flex items-start justify-between gap-4 pl-4 border-l-2 border-primary/20">
                          <span className="text-sm text-muted-foreground">{cf.label}</span>
                          <span className="text-sm font-medium text-right">{labelFromOption ?? String(val)}</span>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div className="space-y-4">
                  {trip.form_fields.map(field => (
                    <EditableFormField
                      key={field.id}
                      field={field}
                      data={bookingDraft}
                      onUpdate={(label, value) => setBookingDraft(prev => ({ ...prev, [label]: value }))}
                    />
                  ))}
                  <BookingDiscountEditor
                    promoCodes={trip.promo_codes}
                    value={bookingDraft['_promo_override'] as PromoCode | undefined}
                    onChange={v => setBookingDraft(prev => {
                      const next = { ...prev };
                      if (v) next['_promo_override'] = v;
                      else delete next['_promo_override'];
                      return next;
                    })}
                  />
                </div>
              )}
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
                {promoDiscount > 0 && (
                  <div className="flex items-center justify-between text-primary">
                    <span className="text-sm">{promo?.code ? `Kampanjkod ${promo.code}` : 'Rabatt'}{promo?.label ? ` (${promo.label})` : ''}</span>
                    <span className="text-sm font-medium">−{promoDiscount.toLocaleString('sv-SE')} {trip.currency}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Pris</span>
                  <span className="text-sm font-medium">{formatPrice(totalSek)}</span>
                </div>
                {tbdLabels.length > 0 && (
                  <p className="text-xs italic text-muted-foreground -mt-1">
                    + pris för {tbdLabels.join(', ')} tillkommer på slutfakturan
                  </p>
                )}
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
                        if (!email && !phone) {
                          toast.error('Saknar både e-post och telefon — kan inte skicka.');
                          return;
                        }
                        const { subject, message } = buildOrderConfirmationEmail(firstName, trip.title, {
                          deposit: trip.payment_info?.deposit,
                          totalPrice: trip.price,
                          extraCosts,
                          isFullyPaid: reg.payment_status === 'paid',
                          tbdLabels,
                          promoCode: promo?.code,
                          promoDiscount,
                        });
                        try {
                          const result = await sendMessage({
                            channel: email ? 'email' : 'sms',
                            recipients: [{ name: fullName, email, phone }],
                            subject,
                            message,
                          });
                          if (result.success) {
                            toast.success(`Orderbekräftelse skickad till ${email || phone}`);
                          } else {
                            toast.error(`Kunde inte skicka orderbekräftelse: ${result.error || 'okänt fel'}`);
                            console.error('sendMessage failed', result.error);
                          }
                        } catch (err) {
                          toast.error(`Oväntat fel: ${err instanceof Error ? err.message : String(err)}`);
                          console.error('sendMessage threw', err);
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
                    <span className="text-sm font-medium">{formatPrice(totalSek)}</span>
                  </div>
                  {tbdLabels.length > 0 && (
                    <p className="text-xs italic text-muted-foreground">
                      + pris för {tbdLabels.join(', ')} tillkommer på slutfakturan
                    </p>
                  )}
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
                            ? formatPrice(totalSek - trip.payment_info.deposit)
                            : formatPrice(totalSek)
                          }
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-between border-t pt-2">
                      <span className="text-sm font-semibold">Att betala</span>
                      <span className="text-sm font-bold">{formatPrice(totalSek)}</span>
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
            <CardHeader className="flex flex-col gap-3 space-y-0 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="flex items-center gap-2 text-lg"><MessageCircle className="h-5 w-5 text-primary" /> Lär känna – svar</CardTitle>
              {!editingPresentation ? (
                <div className="flex flex-wrap gap-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5"
                    title="Kopiera länken till lära känna-formuläret — skicka via SMS/WhatsApp/mejl"
                    onClick={() => {
                      const link = `${window.location.origin}/resa/${trip.id}/presentation/${reg.id}`;
                      navigator.clipboard.writeText(link);
                      toast.success('Länk kopierad');
                    }}
                  >
                    <Copy className="h-3.5 w-3.5" /> Kopiera länk
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => { setPresentationDraft({ ...(reg.presentation_data || {}) }); setEditingPresentation(true); }}
                  >
                    <Pencil className="h-3.5 w-3.5" /> Redigera
                  </Button>
                </div>
              ) : (
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setEditingPresentation(false)} disabled={updateRegistration.isPending}>
                    <X className="h-3.5 w-3.5" /> Avbryt
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    className="gap-1.5"
                    disabled={updateRegistration.isPending}
                    onClick={async () => {
                      try {
                        await updateRegistration.mutateAsync({ id: reg.id, presentation_data: presentationDraft });
                        toast.success('Lära känna-svar uppdaterade');
                        setEditingPresentation(false);
                      } catch (err) {
                        toast.error(`Kunde inte spara: ${err instanceof Error ? err.message : String(err)}`);
                      }
                    }}
                  >
                    {updateRegistration.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Spara
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {editingPresentation ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {trip.presentation_fields.map(pf => (
                    <div key={pf.id} className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">{pf.question}</Label>
                      {pf.type === 'textarea' ? (
                        <Textarea
                          placeholder={pf.placeholder}
                          value={presentationDraft[pf.question] || ''}
                          onChange={e => setPresentationDraft(prev => ({ ...prev, [pf.question]: e.target.value }))}
                        />
                      ) : (
                        <Input
                          placeholder={pf.placeholder}
                          value={presentationDraft[pf.question] || ''}
                          onChange={e => setPresentationDraft(prev => ({ ...prev, [pf.question]: e.target.value }))}
                        />
                      )}
                    </div>
                  ))}
                </div>
              ) : hasPresentationData ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {trip.presentation_fields.map(pf => {
                    const answer = reg.presentation_data?.[pf.question];
                    if (!answer) return null;
                    return (<div key={pf.id} className="space-y-1"><p className="text-sm font-medium text-muted-foreground">{pf.question}</p><p className="text-sm whitespace-pre-line">{answer}</p></div>);
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
