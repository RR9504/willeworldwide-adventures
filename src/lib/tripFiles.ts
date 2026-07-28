import { callApi } from '@/lib/api';
import { TripInfoFile } from '@/types/trip';

const MAX_SIZE = 10 * 1024 * 1024;

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

/** Laddar upp en info-PDF till Supabase Storage via data-api (kräver admin). */
export async function uploadTripInfoFile(file: File): Promise<TripInfoFile> {
  if (file.type !== 'application/pdf' && !/\.pdf$/i.test(file.name)) {
    throw new Error('Endast PDF-filer stöds');
  }
  if (file.size > MAX_SIZE) {
    throw new Error('Filen är för stor (max 10 MB)');
  }
  const content_base64 = await fileToBase64(file);
  const { path, url } = await callApi<{ path: string; url: string }>('tripFiles.upload', {
    filename: file.name,
    content_base64,
  });
  // Visningsnamn: filnamnet utan .pdf och med bindestreck/understreck som mellanslag
  const name = file.name.replace(/\.pdf$/i, '').replace(/[-_]+/g, ' ').trim() || file.name;
  return { name, url, path };
}

/** Tar bort en info-fil ur storage. Fel loggas men stoppar inget — filen kan redan vara borta. */
export async function deleteTripInfoFile(path: string): Promise<void> {
  try {
    await callApi('tripFiles.delete', { path });
  } catch (err) {
    console.warn('Kunde inte ta bort fil ur storage:', err);
  }
}
