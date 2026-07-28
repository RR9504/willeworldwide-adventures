import { useParams, useSearchParams } from 'react-router-dom';
import { CalendarDays, MapPin, Users, Share2, Loader2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import DynamicForm, { SubmitMeta } from '@/components/trips/DynamicForm';
import { TripDescription } from '@/components/trips/TripDescription';
import { useTrip, useTripRegistrationCounts, useCreateRegistration, useCreateRegistrations } from '@/hooks/useTrips';
import { sendMessage, buildRegistrationEmail, calcMinRequiredExtraSek, findPromoCode, calcPromoDiscountSek } from '@/lib/messaging';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const categoryLabels: Record<string, string> = {
  ski: 'Skidresa', group: 'Gruppresa', corporate: 'Företag', other: 'Övrigt',
};

function getDaysUntil(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

const TripRegistrationPage = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const isEmbed = searchParams.get('embed') === 'true';
  const { data: trip, isLoading: tripLoading } = useTrip(id);
  const { data: regCounts = {} } = useTripRegistrationCounts();
  const createRegistration = useCreateRegistration();
  const createRegistrations = useCreateRegistrations();

  if (tripLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="font-heading text-2xl font-bold">Resan hittades inte</h1>
          <p className="mt-2 text-muted-foreground">Kontrollera att länken stämmer.</p>
        </div>
      </div>
    );
  }

  const regCount = id ? (regCounts[id] ?? 0) : 0;
  const spotsLeft = trip.max_participants - regCount;
  const formatDateRange = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    return `${s.toLocaleDateString('sv-SE', { day: 'numeric', month: 'long' })} – ${e.toLocaleDateString('sv-SE', { day: 'numeric', month: 'long', year: 'numeric' })}`;
  };
  const dateStr = formatDateRange(trip.start_date, trip.end_date);
  const daysUntil = getDaysUntil(trip.start_date);
  const fromPrice = trip.price + calcMinRequiredExtraSek(trip.form_fields);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href.replace('?embed=true', ''));
    toast.success('Länk kopierad!');
  };

  const sendRegistrationEmails = async (
    allFormData: Record<string, any>[],
    allPresentationData: Record<string, string>[],
    extraCosts: Record<string, number>,
    tbdLabels: string[],
    promoCode?: string,
  ) => {
    const promo = findPromoCode(trip.promo_codes, promoCode);
    // Rabatten räknas på det varje mejl visar: grundpris + SEK-tillägg.
    const promoDiscount = promo ? calcPromoDiscountSek(trip.price + (extraCosts['SEK'] || 0), promo) : 0;
    for (let i = 0; i < allFormData.length; i++) {
      const formData = allFormData[i];
      const presentationData = allPresentationData[i] || {};
      const email = formData['E-post'];
      const firstName = formData['Förnamn'] || '';
      const lastName = formData['Efternamn'] || '';
      if (!email) continue;

      const { subject, message } = buildRegistrationEmail({
        firstName,
        tripTitle: trip.title,
        deposit: trip.payment_info?.deposit,
        totalPrice: trip.price,
        extraCosts,
        swish: trip.payment_info?.swish ? { number: trip.payment_info.swish.number, name: trip.payment_info.swish.name } : undefined,
        vivaUrl: trip.payment_info?.viva?.url,
        paymentNote: trip.payment_info?.note,
        tbdLabels,
        promoCode: promo?.code,
        promoDiscount,
        formFields: trip.form_fields,
        formData,
        presentationFields: trip.presentation_fields,
        presentationData,
      });
      // Fire and forget — blockera inte UI, men logga fel så de syns i konsolen.
      sendMessage({
        channel: 'email',
        recipients: [{ name: `${firstName} ${lastName}`.trim(), email }],
        subject,
        message,
      })
        .then(r => { if (!r.success) console.error(`Registreringsmejl till ${email} misslyckades:`, r.error); })
        .catch(err => console.error(`Registreringsmejl till ${email} kastade:`, err));
    }
  };

  const handleSubmit = async (data: Record<string, any>, companions?: Record<string, any>[], meta?: SubmitMeta) => {
    try {
      const groupId = companions?.length ? crypto.randomUUID() : undefined;
      const extraCosts = meta?.extraCosts || {};
      const tbdLabels = meta?.tbdLabels || [];
      const promoCode = meta?.promoCode;
      const presentationData = meta?.presentationData || {};
      const companionPresentations = meta?.companionPresentations || [];

      // Spara använd kampanjkod på varje anmälan så admin/mejl kan återskapa rabatten.
      const withPromo = (d: Record<string, any>) => (promoCode ? { ...d, _promo_code: promoCode } : d);
      const mainData = withPromo(groupId ? { ...data, _group_id: groupId } : data);

      if (companions && companions.length > 0) {
        const allRegs = [
          { trip_id: trip.id, form_data: mainData, presentation_data: presentationData },
          ...companions.map((c, idx) => ({
            trip_id: trip.id,
            form_data: withPromo({ ...c, _group_id: groupId }),
            presentation_data: companionPresentations[idx] || {},
          })),
        ];
        await createRegistrations.mutateAsync(allRegs);
        toast.success(`${allRegs.length} anmälningar skickade!`);
        sendRegistrationEmails([mainData, ...companions], [presentationData, ...companionPresentations], extraCosts, tbdLabels, promoCode);
      } else {
        await createRegistration.mutateAsync({ trip_id: trip.id, form_data: mainData, presentation_data: presentationData });
        toast.success('Anmälan skickad!');
        sendRegistrationEmails([mainData], [presentationData], extraCosts, tbdLabels, promoCode);
      }
    } catch {
      toast.error('Något gick fel. Försök igen.');
    }
  };

  return (
    <div className={`flex min-h-screen flex-col ${isEmbed ? 'bg-transparent' : 'bg-muted/30'}`}>
      {!isEmbed && (
        <div className="relative h-64 overflow-hidden md:h-80">
          <img src={trip.image_url} alt={trip.title} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="container">
              <Badge className="mb-3 bg-primary text-primary-foreground">{categoryLabels[trip.category]}</Badge>
              <h1 className="font-heading text-3xl font-extrabold text-white md:text-4xl">{trip.title}</h1>
            </div>
          </div>
        </div>
      )}

      <main className={`flex-1 ${isEmbed ? 'p-4' : 'container py-8'}`}>
        {isEmbed && (
          <div className="mb-4">
            <Badge className="mb-2 bg-primary text-primary-foreground">{categoryLabels[trip.category]}</Badge>
            <h1 className="font-heading text-2xl font-bold">{trip.title}</h1>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-3">
          <motion.div className="lg:col-span-1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
            <Card>
              <CardHeader><CardTitle className="text-lg">Reseinformation</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm"><MapPin className="h-4 w-4 text-primary" /><span>{trip.destination}</span></div>
                <div className="flex items-start gap-2 text-sm">
                  <CalendarDays className="h-4 w-4 text-primary mt-0.5" />
                  <div>
                    <span>{dateStr}</span>
                    {trip.additional_dates?.map((d, i) => (
                      <span key={i} className="block text-muted-foreground">{d.label ? `${d.label}: ` : ''}{formatDateRange(d.start_date, d.end_date)}</span>
                    ))}
                  </div>
                </div>

                {/* Countdown */}
                {daysUntil > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-primary" />
                    <span>{daysUntil} dagar till avresa</span>
                  </div>
                )}

                {/* Spots left */}
                {trip.show_spots_left && (!trip.spots_left_threshold || spotsLeft <= trip.spots_left_threshold) && (
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-primary" />
                    <span>{spotsLeft > 0 ? `${spotsLeft} plats${spotsLeft === 1 ? '' : 'er'} kvar` : 'Fullbokad'}</span>
                  </div>
                )}

                {/* Price */}
                <div className="rounded-lg bg-accent p-4 text-center">
                  {fromPrice > 0 ? (
                    <>
                      <p className="text-sm text-muted-foreground">Pris från</p>
                      <p className="font-heading text-3xl font-bold text-foreground">{fromPrice.toLocaleString('sv-SE')} <span className="text-base">{trip.currency}</span></p>
                    </>
                  ) : (
                    <p className="font-heading text-2xl font-bold text-foreground">Pris på förfrågan</p>
                  )}
                </div>

                <TripDescription text={trip.description} />

                {!isEmbed && (
                  <Button variant="ghost" size="sm" className="w-full gap-2 text-muted-foreground" onClick={handleShare}><Share2 className="h-4 w-4" /> Dela resa</Button>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div className="lg:col-span-2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
            <Card>
              <CardHeader><CardTitle className="text-lg">Anmälan</CardTitle></CardHeader>
              <CardContent>
                {spotsLeft <= 0 ? (
                  <div className="py-8 text-center">
                    <p className="font-heading text-xl font-bold text-destructive">Resan är fullbokad</p>
                    <p className="mt-2 text-muted-foreground">Kontakta oss om du vill stå på väntelista.</p>
                  </div>
                ) : (
                  <DynamicForm fields={trip.form_fields} presentationFields={trip.presentation_fields} onSubmit={handleSubmit} paymentInfo={trip.payment_info} tripPrice={trip.price} promoCodes={trip.promo_codes} />
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>

      {!isEmbed && (
        <footer className="border-t py-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Wille Worldwide
        </footer>
      )}
    </div>
  );
};

export default TripRegistrationPage;
