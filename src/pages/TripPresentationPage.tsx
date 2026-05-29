import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { ArrowLeft, Printer, Loader2, Sparkles, FileSpreadsheet, RefreshCw } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Header from '@/components/layout/Header';
import { useTrip, useRegistrations, useUpdateRegistration } from '@/hooks/useTrips';
import { generateAiSummary } from '@/lib/messaging';
import { Registration } from '@/types/trip';
import { toast } from 'sonner';

const TripPresentationPage = () => {
  const { id } = useParams<{ id: string }>();
  const { data: trip, isLoading: tripLoading } = useTrip(id);
  const { data: registrations = [], isLoading: regsLoading } = useRegistrations(id);
  const updateRegistration = useUpdateRegistration();
  const [genInProgress, setGenInProgress] = useState<Set<string>>(new Set());

  if (tripLoading || regsLoading) {
    return (<div className="flex min-h-screen flex-col bg-muted/30"><Header /><div className="flex flex-1 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></div>);
  }

  if (!trip) {
    return (<div className="flex min-h-screen flex-col"><Header /><div className="container flex flex-1 items-center justify-center"><p>Resan hittades inte</p></div></div>);
  }

  const withPresentation = registrations.filter(r => r.presentation_data && Object.keys(r.presentation_data).length > 0);
  const missingSummaryCount = withPresentation.filter(r => !r.ai_summary).length;

  const generateOne = async (reg: Registration) => {
    if (!reg.presentation_data) return;
    setGenInProgress(prev => new Set(prev).add(reg.id));
    try {
      const name = `${reg.form_data['Förnamn'] || ''} ${reg.form_data['Efternamn'] || ''}`.trim() || 'Deltagare';
      const answers = trip.presentation_fields
        .map(pf => ({ question: pf.question, answer: reg.presentation_data?.[pf.question] || '' }))
        .filter(a => a.answer.trim() !== '');
      const result = await generateAiSummary({ name, tripTitle: trip.title, answers });
      if (!result.success || !result.summary) {
        toast.error(`Kunde inte generera för ${name}: ${result.error || 'okänt fel'}`);
        return;
      }
      await updateRegistration.mutateAsync({ id: reg.id, ai_summary: result.summary });
      toast.success(`Sammanfattning klar för ${name}`);
    } catch (err) {
      toast.error(`Oväntat fel: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setGenInProgress(prev => { const next = new Set(prev); next.delete(reg.id); return next; });
    }
  };

  const generateMissing = async () => {
    const missing = withPresentation.filter(r => !r.ai_summary);
    if (missing.length === 0) {
      toast.info('Alla har redan en sammanfattning');
      return;
    }
    toast.info(`Genererar för ${missing.length} deltagare …`);
    // Sekventiellt — för att inte hamra API:t och slippa rate-limit
    for (const reg of missing) {
      await generateOne(reg);
    }
  };

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
            {missingSummaryCount > 0 && (
              <Button variant="outline" size="sm" onClick={generateMissing} disabled={genInProgress.size > 0} className="gap-2">
                {genInProgress.size > 0 ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Generera {missingSummaryCount} saknade
              </Button>
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
