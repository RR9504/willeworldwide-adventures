import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Eye, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import Header from '@/components/layout/Header';
import FormFieldList from '@/components/admin/FormFieldList';
import FormPreview from '@/components/admin/FormPreview';
import { Trip, TripCategory, TripStatus, FormField, FormFieldType, PresentationQuestion } from '@/types/trip';
import { mockTrips } from '@/data/mockTrips';
import { formTemplates } from '@/data/formTemplates';
import { toast } from 'sonner';

const categoryLabels: Record<TripCategory, string> = {
  ski: 'Skidresa',
  group: 'Gruppresa',
  corporate: 'Företagsresa',
  other: 'Övrigt',
};

const statusLabels: Record<TripStatus, string> = {
  draft: 'Utkast',
  published: 'Publicerad',
  closed: 'Stängd',
};

const defaultFormFields: FormField[] = [
  { id: 'default-1', type: 'text', label: 'Förnamn', required: true, placeholder: 'Ditt förnamn' },
  { id: 'default-2', type: 'text', label: 'Efternamn', required: true, placeholder: 'Ditt efternamn' },
  { id: 'default-3', type: 'email', label: 'E-post', required: true, placeholder: 'din@email.se' },
  { id: 'default-4', type: 'phone', label: 'Telefon', required: true, placeholder: '070-123 45 67' },
];

const defaultPresentationFields: PresentationQuestion[] = [
  { id: 'pq-1', question: 'Berätta lite om dig själv!', type: 'textarea', placeholder: 'Vem är du? Vad gör du till vardags?' },
  { id: 'pq-2', question: 'Varifrån kommer du?', type: 'text', placeholder: 'Stad/ort' },
  { id: 'pq-3', question: 'Hur gammal är du?', type: 'text', placeholder: 'Ålder' },
  { id: 'pq-4', question: 'Vad jobbar du med?', type: 'text', placeholder: 'Yrke/sysselsättning' },
  { id: 'pq-5', question: 'Vad ser du mest fram emot på resan?', type: 'textarea', placeholder: 'Skidåkningen, umgänget, maten...?' },
];

let fieldCounter = 100;
const generateFieldId = () => `field-${++fieldCounter}`;
let pqCounter = 100;
const generatePqId = () => `pq-${++pqCounter}`;

const CreateTripPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;

  const existingTrip = isEditing ? mockTrips.find(t => t.id === id) : null;

  const [title, setTitle] = useState(existingTrip?.title || '');
  const [description, setDescription] = useState(existingTrip?.description || '');
  const [destination, setDestination] = useState(existingTrip?.destination || '');
  const [category, setCategory] = useState<TripCategory>(existingTrip?.category || 'ski');
  const [startDate, setStartDate] = useState(existingTrip?.start_date || '');
  const [endDate, setEndDate] = useState(existingTrip?.end_date || '');
  const [price, setPrice] = useState(existingTrip?.price?.toString() || '');
  const [maxParticipants, setMaxParticipants] = useState(existingTrip?.max_participants?.toString() || '');
  const [showSpotsLeft, setShowSpotsLeft] = useState(existingTrip?.show_spots_left ?? true);
  const [spotsLeftThreshold, setSpotsLeftThreshold] = useState(existingTrip?.spots_left_threshold?.toString() || '');
  const [imageUrl, setImageUrl] = useState(existingTrip?.image_url || '');
  const [status, setStatus] = useState<TripStatus>(existingTrip?.status || 'draft');
  const [formFields, setFormFields] = useState<FormField[]>(existingTrip?.form_fields || defaultFormFields);
  const [presentationFields, setPresentationFields] = useState<PresentationQuestion[]>(existingTrip?.presentation_fields || defaultPresentationFields);
  const [saving, setSaving] = useState(false);

  const addField = (type: FormFieldType) => {
    const newField: FormField = {
      id: generateFieldId(),
      type,
      label: '',
      required: false,
      ...(type === 'select' ? { options: [{ label: '', value: '' }] } : {}),
    };
    setFormFields(prev => [...prev, newField]);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Ange en titel för resan');
      return;
    }
    if (!destination.trim()) {
      toast.error('Ange en destination');
      return;
    }
    if (!startDate || !endDate) {
      toast.error('Ange start- och slutdatum');
      return;
    }

    const emptyLabels = formFields.filter(f => !f.label.trim());
    if (emptyLabels.length > 0) {
      toast.error(`${emptyLabels.length} fält saknar etikett`);
      return;
    }

    setSaving(true);

    const trip: Trip = {
      id: existingTrip?.id || String(Date.now()),
      title: title.trim(),
      description: description.trim(),
      destination: destination.trim(),
      category,
      start_date: startDate,
      end_date: endDate,
      price: Number(price) || 0,
      currency: 'SEK',
      max_participants: Number(maxParticipants) || 50,
      show_spots_left: showSpotsLeft,
      spots_left_threshold: spotsLeftThreshold ? Number(spotsLeftThreshold) : undefined,
      image_url: imageUrl.trim(),
      status,
      form_fields: formFields,
      presentation_fields: presentationFields,
      created_at: existingTrip?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // TODO: Save to Supabase
    console.log('Saving trip:', trip);

    setTimeout(() => {
      setSaving(false);
      toast.success(isEditing ? 'Resan uppdaterad!' : 'Resan skapad!');
      navigate('/dashboard');
    }, 500);
  };

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <Header />
      <main className="container flex-1 py-8">
        <Link to="/dashboard" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Tillbaka till dashboard
        </Link>

        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-heading text-2xl font-bold">
            {isEditing ? 'Redigera resa' : 'Skapa ny resa'}
          </h1>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'Sparar...' : 'Spara resa'}
          </Button>
        </div>

        <Tabs defaultValue="details" className="space-y-6">
          <TabsList>
            <TabsTrigger value="details">Reseinformation</TabsTrigger>
            <TabsTrigger value="form">Anmälningsformulär</TabsTrigger>
            <TabsTrigger value="presentation">Lär känna-frågor</TabsTrigger>
            <TabsTrigger value="preview" className="gap-1.5">
              <Eye className="h-3.5 w-3.5" /> Förhandsgranska
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Trip details */}
          <TabsContent value="details">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Grundinformation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Titel *</Label>
                    <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="t.ex. Skidresa Canazei – Vecka 3" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Destination *</Label>
                    <Input value={destination} onChange={e => setDestination(e.target.value)} placeholder="t.ex. Canazei/Alba, Italien" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Beskrivning</Label>
                  <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Beskriv resan..." rows={4} />
                </div>

                <Separator />

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-1.5">
                    <Label>Kategori</Label>
                    <Select value={category} onValueChange={(v: TripCategory) => setCategory(v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(categoryLabels).map(([val, label]) => (
                          <SelectItem key={val} value={val}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Status</Label>
                    <Select value={status} onValueChange={(v: TripStatus) => setStatus(v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(statusLabels).map(([val, label]) => (
                          <SelectItem key={val} value={val}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Startdatum *</Label>
                    <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Slutdatum *</Label>
                    <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                  </div>
                </div>

                <Separator />

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label>Pris (SEK)</Label>
                    <Input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="0" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Max deltagare</Label>
                    <Input type="number" value={maxParticipants} onChange={e => setMaxParticipants(e.target.value)} placeholder="50" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Switch checked={showSpotsLeft} onCheckedChange={setShowSpotsLeft} />
                      <Label>Visa platser kvar</Label>
                    </div>
                    {showSpotsLeft && (
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Visa först när det är X platser kvar (lämna tomt = visa alltid)</Label>
                        <Input type="number" value={spotsLeftThreshold} onChange={e => setSpotsLeftThreshold(e.target.value)} placeholder="t.ex. 10" />
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                <div className="space-y-1.5">
                  <Label>Bild-URL</Label>
                  <Input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..." />
                  {imageUrl && (
                    <div className="mt-2 overflow-hidden rounded-lg border">
                      <img src={imageUrl} alt="Förhandsgranskning" className="h-48 w-full object-cover" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 2: Form builder */}
          <TabsContent value="form">
            <div className="space-y-4">
              {/* Template selector — only for new trips */}
              {!isEditing && (
                <Card>
                  <CardContent className="p-4">
                    <p className="mb-3 text-sm font-medium">Starta från mall</p>
                    <div className="flex flex-wrap gap-2">
                      {formTemplates.map(t => (
                        <Button
                          key={t.id}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setFormFields(t.fields.map((f, i) => ({ ...f, id: `tmpl-${i}` })));
                            toast.success(`Mall "${t.name}" tillämpad`);
                          }}
                        >
                          {t.name}
                        </Button>
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Välj en mall för att fylla i standardfält. Du kan sedan anpassa fritt.
                    </p>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Anmälningsformulär</CardTitle>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Dra fält för att ändra ordning. Klicka på ett fält för att redigera.
                      </p>
                    </div>
                    <span className="rounded bg-muted px-2 py-1 text-sm text-muted-foreground">
                      {formFields.length} fält
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  {formFields.length === 0 ? (
                    <div className="flex items-center justify-center rounded-lg border border-dashed py-12">
                      <p className="text-sm text-muted-foreground">Inga fält ännu. Lägg till fält nedan.</p>
                    </div>
                  ) : (
                    <FormFieldList fields={formFields} onChange={setFormFields} />
                  )}
                </CardContent>
              </Card>

              {/* Add field buttons */}
              <Card>
                <CardContent className="p-4">
                  <p className="mb-3 text-sm font-medium">Lägg till fält</p>
                  <div className="flex flex-wrap gap-2">
                    {([
                      ['text', 'Text'],
                      ['email', 'E-post'],
                      ['phone', 'Telefon'],
                      ['textarea', 'Textruta'],
                      ['select', 'Dropdown'],
                      ['checkbox', 'Kryssruta'],
                    ] as [FormFieldType, string][]).map(([type, label]) => (
                      <Button
                        key={type}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addField(type)}
                        className="gap-1.5"
                      >
                        <Plus className="h-3 w-3" /> {label}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab 3: Presentation questions */}
          <TabsContent value="presentation">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Lär känna-frågor</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Frågor som skickas till varje deltagare efter anmälan. Svaren sammanställs till en deltagarpresentation.
                    </p>
                  </div>
                  <span className="rounded bg-muted px-2 py-1 text-sm text-muted-foreground">
                    {presentationFields.length} frågor
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {presentationFields.map((pf, idx) => (
                  <div key={pf.id} className="flex items-start gap-3 rounded-lg border p-3">
                    <span className="mt-1 text-sm font-medium text-muted-foreground">{idx + 1}.</span>
                    <div className="flex-1 space-y-2">
                      <Input
                        value={pf.question}
                        onChange={e => {
                          const updated = [...presentationFields];
                          updated[idx] = { ...pf, question: e.target.value };
                          setPresentationFields(updated);
                        }}
                        placeholder="Skriv frågan..."
                      />
                      <div className="flex items-center gap-4">
                        <Select
                          value={pf.type}
                          onValueChange={(v: 'text' | 'textarea') => {
                            const updated = [...presentationFields];
                            updated[idx] = { ...pf, type: v };
                            setPresentationFields(updated);
                          }}
                        >
                          <SelectTrigger className="w-36">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">Kort svar</SelectItem>
                            <SelectItem value="textarea">Långt svar</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          value={pf.placeholder || ''}
                          onChange={e => {
                            const updated = [...presentationFields];
                            updated[idx] = { ...pf, placeholder: e.target.value };
                            setPresentationFields(updated);
                          }}
                          placeholder="Placeholder-text (valfritt)"
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="mt-1 h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setPresentationFields(prev => prev.filter((_, i) => i !== idx))}
                    >
                      <span className="text-lg">×</span>
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPresentationFields(prev => [
                    ...prev,
                    { id: generatePqId(), question: '', type: 'text', placeholder: '' },
                  ])}
                  className="gap-1.5"
                >
                  <Plus className="h-3 w-3" /> Lägg till fråga
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 4: Preview */}
          <TabsContent value="preview">
            <FormPreview fields={formFields} tripTitle={title} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default CreateTripPage;
