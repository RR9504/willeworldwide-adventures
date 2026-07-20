import { supabase } from '@/integrations/supabase/client';

const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/data-api`;
const ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

/**
 * Anropar data-api edge-funktionen. Skickar den inloggade användarens
 * Supabase-token (för admin-actions) om den finns, annars anon-nyckeln.
 * Databasinloggningen finns bara server-side i funktionen.
 */
export async function callApi<T = unknown>(
  action: string,
  params: Record<string, unknown> = {},
): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token ?? ANON;

  const res = await fetch(FN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: ANON,
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ action, params }),
  });

  let payload: unknown;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }
  if (!res.ok) {
    const msg = (payload as { error?: string })?.error ?? `API-fel (${res.status})`;
    throw new Error(msg);
  }
  return payload as T;
}
