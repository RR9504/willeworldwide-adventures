import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { ArrowLeft, Printer, Loader2, Sparkles, FileSpreadsheet, RefreshCw } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import Header from '@/components/layout/Header';
import { useTrip, useRegistrations, useUpdateRegistration } from '@/hooks/useTrips';
import { generateAiSummary } from '@/lib/messaging';
import { Registration } from '@/types/trip';
import { toast } from 'sonner';

// Samtidiga AI-anrop vid mass-generering — håller oss under Anthropics rate-limits men ger ~5× speedup.
const BATCH_CONCURRENCY = 5;

const TripPresentationPage = () => {
  const { id } = useParams<{ id: string }>();
  const { data: trip, isLoading: tripLoading } = useTrip(id);
  const { data: registrations = [], isLoading: regsLoading } = useRegistrations(id);
  const updateRegistration = useUpdateRegistration();
  const [genInProgress, setGenInProgress] = useState<Set<string>>(new Set());
  const [batchProgress, setBatchProgress] = useState<{ done: number; total: number } | null>(null);

  if (tripLoading || regsLoading) {
    return (<div className="flex min-h-screen flex-col bg-muted/30"><Header /><div className="flex flex-1 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></div>);
  }

  if (!trip) {
    return (<div className="flex min-h-screen flex-col"><Header /><div className="container flex flex-1 items-center justify-center"><p>Resan hittades inte</p></div></div>);
  }

  const withPresentation = registrations.filter(r => r.presentation_data && Object.keys(r.presentation_data).length > 0);
  const missingSummaryCount = withPresentation.filter(r => !r.ai_summary).length;

  // Returnerar true vid lyckad generering, false annars. `silent` undertrycker per-deltagare-toasts (batch hanterar feedback samlat).
  const generateOne = async (reg: Registration, silent = false): Promise<boolean> => {
    if (!reg.presentation_data) return false;
    setGenInProgress(prev => new Set(prev).add(reg.id));
    const name = `${reg.form_data['Förnamn'] || ''} ${reg.form_data['Efternamn'] || ''}`.trim() || 'Deltagare';
    try {
      const answers = trip.presentation_fields
        .map(pf => ({ question: pf.question, answer: reg.presentation_data?.[pf.question] || '' }))
        .filter(a => a.answer.trim() !== '');
      const result = await generateAiSummary({ name, tripTitle: trip.title, answers });
      if (!result.success || !result.summary) {
        if (!silent) toast.error(`Kunde inte generera för ${name}: ${result.error || 'okänt fel'}`);
        return false;
      }
      await updateRegistration.mutateAsync({ id: reg.id, ai_summary: result.summary });
      if (!silent) toast.success(`Sammanfattning klar för ${name}`);
      return true;
    } catch (err) {
      if (!silent) toast.error(`Oväntat fel för ${name}: ${err instanceof Error ? err.message : String(err)}`);
      return false;
    } finally {
      setGenInProgress(prev => { const next = new Set(prev); next.delete(reg.id); return next; });
    }
  };

  // Kör generateOne på en lista deltagare med begränsad parallellitet och live-progress.
  const generateBatch = async (regs: Registration[], action: string) => {
    if (regs.length === 0) {
      toast.info('Inget att generera');
      return;
    }
    setBatchProgress({ done: 0, total: regs.length });
    let okCount = 0;
    let failCount = 0;
    try {
      for (let i = 0; i < regs.length; i += BATCH_CONCURRENCY) {
        const chunk = regs.slice(i, i + BATCH_CONCURRENCY);
        const results = await Promise.all(chunk.map(r => generateOne(r, true)));
        results.forEach(ok => ok ? okCount++ : failCount++);
        setBatchProgress({ done: Math.min(i + BATCH_CONCURRENCY, regs.length), total: regs.length });
      }
      if (failCount === 0) toast.success(`${action}: ${okCount} sammanfattningar klara`);
      else if (okCount === 0) toast.error(`${action} misslyckades för alla ${failCount} deltagare`);
      else toast.warning(`${action}: ${okCount} klara, ${failCount} misslyckades`);
    } finally {
      setBatchProgress(null);
    }
  };

  const generateMissing = () => generateBatch(withPresentation.filter(r => !r.ai_summary), 'Saknade');
  const regenerateAll = () => generateBatch(withPresentation, 'Genererat om');

  const exportExcel = () => {
    if (withPresentation.length === 0) {
      toast.error('Inga deltagare att exportera');
      return;
    }
    const rows = withPresentation.map(reg => {
      const name = `${reg.form_data['Förnamn'] || ''} ${reg.form_data['Efternamn'] || ''}`.trim();
      const row: Record<string, string> = { Namn: name };
      if (reg.ai_summary) row['AI-sammanfattning'] = reg.ai_summary;
      trip.presentation_fields.forEach(pf => {
        row[pf.question] = reg.presentation_data?.[pf.question] || '';
      });
      return row;
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    // Auto-bredd per kolumn baserat på innehåll (max 60 tecken så långa svar inte exploderar)
    const headers = Object.keys(rows[0] || {});
    ws['!cols'] = headers.map(h => {
      const maxLen = Math.max(h.length, ...rows.map(r => (r[h] || '').length));
      return { wch: Math.min(maxLen + 2, 60) };
    });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Deltagarpresentation');
    const safeTitle = trip.title.replace(/[^a-zA-Z0-9_-]+/g, '_');
    XLSX.writeFile(wb, `${safeTitle}_presentation.xlsx`);
    toast.success('Excel-fil exporterad!');
  };

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <Header />
      <main className="container flex-1 py-8">
        <div className="mb-6 flex flex-col gap-3 print:hidden sm:flex-row sm:items-center sm:justify-between">
          <Link to={`/dashboard/resor/${trip.id}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Tillbaka till {trip.title}
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">{withPresentation.length} av {registrations.length} har svarat</span>

            {/* Generera saknade — alltid synlig men greyad när 0 */}
            <Button
              variant="outline"
              size="sm"
              onClick={generateMissing}
              disabled={missingSummaryCount === 0 || !!batchProgress}
              className="gap-2"
            >
              {batchProgress ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Genererar {batchProgress.done}/{batchProgress.total}…</>
              ) : (
                <><Sparkles className="h-4 w-4" /> Generera {missingSummaryCount > 0 ? `${missingSummaryCount} ` : ''}saknade</>
              )}
            </Button>

            {/* Generera om alla — med bekräftelse eftersom befintliga skrivs över */}
            {withPresentation.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2" disabled={!!batchProgress}>
                    <RefreshCw className="h-4 w-4" /> Generera om alla
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Generera om alla sammanfattningar?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Alla <strong>{withPresentation.length}</strong> befintliga AI-sammanfattningar skrivs över med nya. Detta går inte att ångra.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Avbryt</AlertDialogCancel>
                    <AlertDialogAction onClick={regenerateAll}>Ja, generera om alla</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            <Button variant="outline" size="sm" onClick={exportExcel} className="gap-2">
              <FileSpreadsheet className="h-4 w-4" /> Exportera Excel
            </Button>
            <Button size="sm" onClick={() => window.print()} className="gap-2"><Printer className="h-4 w-4" /> Skriv ut</Button>
          </div>
        </div>

        <div className="mb-8 text-center">
          <h1 className="font-heading text-3xl font-bold">{trip.title}</h1>
          <p className="mt-1 text-lg text-muted-foreground">{trip.destination} · {new Date(trip.start_date).toLocaleDateString('sv-SE', { day: 'numeric', month: 'long' })} – {new Date(trip.end_date).toLocaleDateString('sv-SE', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          <p className="mt-2 text-sm text-muted-foreground">Lär känna dina medresenärer!</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 print:grid-cols-2 print:gap-4">
          {withPresentation.map(reg => {
            const name = `${reg.form_data['Förnamn'] || ''} ${reg.form_data['Efternamn'] || ''}`.trim();
            const city = reg.presentation_data?.['Varifrån kommer du?'];
            const age = reg.presentation_data?.['Hur gammal är du?'];
            const job = reg.presentation_data?.['Vad jobbar du med?'];
            const subtitle = [age ? `${age} år` : '', city, job].filter(Boolean).join(' · ');
            const generating = genInProgress.has(reg.id);
            return (
              <Card key={reg.id} className="break-inside-avoid print:shadow-none print:border">
                <CardContent className="p-5">
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-heading text-lg font-bold">{name}</h3>
                      {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-primary print:hidden"
                      title={reg.ai_summary ? 'Generera om sammanfattning' : 'Generera AI-sammanfattning'}
                      disabled={generating}
                      onClick={() => generateOne(reg)}
                    >
                      {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : reg.ai_summary ? <RefreshCw className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                    </Button>
                  </div>

                  {reg.ai_summary && (
                    <p className="mb-4 whitespace-pre-line border-l-2 border-primary/40 pl-3 text-sm italic text-foreground/90">
                      {reg.ai_summary}
                    </p>
                  )}

                  <div className="space-y-2">
                    {trip.presentation_fields
                      .filter(pf => {
                        const answer = reg.presentation_data?.[pf.question];
                        if (['Varifrån kommer du?', 'Hur gammal är du?', 'Vad jobbar du med?'].includes(pf.question)) return false;
                        return answer && answer.trim() !== '';
                      })
                      .map(pf => (
                        <div key={pf.id}>
                          <p className="text-xs font-semibold text-muted-foreground">{pf.question}</p>
                          <p className="text-sm">{reg.presentation_data?.[pf.question]}</p>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {withPresentation.length === 0 && (
          <div className="py-20 text-center text-muted-foreground"><p className="text-lg">Inga deltagare har fyllt i presentationsformuläret ännu.</p></div>
        )}
      </main>
    </div>
  );
};

export default TripPresentationPage;
