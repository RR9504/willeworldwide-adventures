import { supabase } from '@/integrations/supabase/client';
import { TripItinerary } from '@/types/trip';

const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-itinerary`;
const ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // Data-URL: "data:application/pdf;base64,XXXX" — vi vill bara ha XXXX.
      const result = reader.result as string;
      resolve(result.slice(result.indexOf(',') + 1));
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/** Skickar en resenärsschema-PDF till AI-tolkning. Kräver inloggad admin. */
export async function parseItineraryPdf(
  file: File,
): Promise<{ success: boolean; itinerary?: TripItinerary; error?: string }> {
  try {
    const pdf_base64 = await fileToBase64(file);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return { success: false, error: 'Du måste vara inloggad.' };

    const res = await fetch(FN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: ANON,
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ pdf_base64 }),
    });
    if (res.status === 404) {
      return { success: false, error: 'Edge function "parse-itinerary" är inte deployad än.' };
    }
    let data: { success?: boolean; itinerary?: TripItinerary; error?: string } = {};
    try {
      data = await res.json();
    } catch {
      return { success: false, error: `Oväntat svar från servern (HTTP ${res.status}).` };
    }
    if (!res.ok || data.success === false || !data.itinerary) {
      return { success: false, error: data.error || `HTTP ${res.status}` };
    }
    return { success: true, itinerary: data.itinerary };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/failed to fetch|networkerror|load failed/i.test(msg)) {
      return { success: false, error: 'Kunde inte nå AI-tjänsten — kontrollera att edge function "parse-itinerary" är deployad.' };
    }
    return { success: false, error: `Kunde inte tolka PDF:en: ${msg}` };
  }
}
