import { useEffect, useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, ExternalLink, Save, RotateCcw, Loader2 } from 'lucide-react';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { getEditablePage } from '@/data/editableContent';
import { usePageOverride, useSavePageContent } from '@/hooks/usePageContent';

const ContentEditorPage = () => {
  const { slug = '' } = useParams();
  const page = getEditablePage(slug);
  const { data: override, isLoading } = usePageOverride(slug);
  const save = useSavePageContent();

  const [values, setValues] = useState<Record<string, string>>({});
  const [ready, setReady] = useState(false);

  // Initiera formuläret när sparade värden laddats (sparat värde annars standard).
  useEffect(() => {
    if (!page || override === undefined) return;
    const init: Record<string, string> = {};
    for (const f of page.fields) init[f.key] = override[f.key] ?? f.default;
    setValues(init);
    setReady(true);
  }, [page, override]);

  if (!page) return <Navigate to="/dashboard/innehall" replace />;

  const setField = (key: string, val: string) => setValues((v) => ({ ...v, [key]: val }));

  const resetToDefaults = () => {
    const init: Record<string, string> = {};
    for (const f of page.fields) init[f.key] = f.default;
    setValues(init);
    toast.info('Återställt till standardtext – klicka Spara för att publicera.');
  };

  const handleSave = () => {
    save.mutate(
      { slug, content: values },
      {
        onSuccess: () => toast.success('Sparat och publicerat!'),
        onError: () => toast.error('Något gick fel – försök igen.'),
      }
    );
  };

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <Header />
      <main className="container max-w-3xl flex-1 py-8">
        <Link
          to="/dashboard/innehall"
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Alla sidor
        </Link>

        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-heading text-2xl font-bold">{page.name}</h1>
            <a
              href={page.path}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              {page.path} <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={resetToDefaults} disabled={!ready}>
              <RotateCcw className="h-4 w-4" /> Standardtext
            </Button>
            <Button className="gap-2" onClick={handleSave} disabled={!ready || save.isPending}>
              {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Spara &amp; publicera
            </Button>
          </div>
        </div>

        {isLoading || !ready ? (
          <div className="flex items-center gap-2 py-20 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Laddar innehåll…
          </div>
        ) : (
          <div className="space-y-6">
            {page.fields.map((field) => (
              <div key={field.key} className="rounded-xl border bg-card p-5">
                <Label htmlFor={field.key} className="text-sm font-semibold">
                  {field.label}
                </Label>
                {field.help && <p className="mb-2 mt-0.5 text-xs text-muted-foreground">{field.help}</p>}
                {field.multiline ? (
                  <Textarea
                    id={field.key}
                    value={values[field.key] ?? ''}
                    onChange={(e) => setField(field.key, e.target.value)}
                    className="mt-2 min-h-[120px]"
                  />
                ) : (
                  <Input
                    id={field.key}
                    value={values[field.key] ?? ''}
                    onChange={(e) => setField(field.key, e.target.value)}
                    className="mt-2"
                  />
                )}
              </div>
            ))}

            {/* Spara även längst ner för långa sidor */}
            <div className="flex justify-end">
              <Button className="gap-2" onClick={handleSave} disabled={save.isPending}>
                {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Spara &amp; publicera
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ContentEditorPage;
