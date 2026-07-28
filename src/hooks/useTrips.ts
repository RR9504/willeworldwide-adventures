import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { callApi } from '@/lib/api';
import { Trip, TripCategory, TripStatus, FormField, PresentationQuestion, TripDateRange, PromoCode, TripItinerary } from '@/types/trip';

// Re-export registration hooks so pages can import everything from useTrips
export { useRegistrations, useAllRegistrations, useTripRegistrationCounts, useRegistration, useRegistrationById, useUpdateOwnRegistration, useCreateRegistration, useCreateRegistrations, useUpdateRegistration, useDeleteRegistration } from './useRegistrations';

function mapTrip(row: any): Trip {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    destination: row.destination,
    category: row.category as TripCategory,
    start_date: row.start_date,
    end_date: row.end_date,
    price: Number(row.price),
    currency: row.currency,
    max_participants: row.max_participants,
    show_spots_left: row.show_spots_left,
    spots_left_threshold: row.spots_left_threshold ?? undefined,
    image_url: row.image_url,
    image_position: row.image_position ?? undefined,
    status: row.status as TripStatus,
    form_fields: (typeof row.form_fields === 'string' ? JSON.parse(row.form_fields) : row.form_fields) as FormField[],
    presentation_fields: (typeof row.presentation_fields === 'string' ? JSON.parse(row.presentation_fields) : row.presentation_fields) as PresentationQuestion[],
    additional_dates: row.additional_dates ? (typeof row.additional_dates === 'string' ? JSON.parse(row.additional_dates) : row.additional_dates) as TripDateRange[] : undefined,
    promo_codes: row.promo_codes ? (typeof row.promo_codes === 'string' ? JSON.parse(row.promo_codes) : row.promo_codes) as PromoCode[] : undefined,
    itinerary: row.itinerary ? (typeof row.itinerary === 'string' ? JSON.parse(row.itinerary) : row.itinerary) as TripItinerary : undefined,
    payment_info: row.payment_info ? (typeof row.payment_info === 'string' ? JSON.parse(row.payment_info) : row.payment_info) : undefined,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/** Alla resor (admin – dashboard). */
export function useTrips() {
  return useQuery({
    queryKey: ['trips'],
    queryFn: async () => {
      const rows = await callApi<any[]>('trips.listAll');
      return rows.map(mapTrip);
    },
  });
}

/** Endast publicerade resor (publik startsida). */
export function usePublishedTrips() {
  return useQuery({
    queryKey: ['trips', 'published'],
    queryFn: async () => {
      const rows = await callApi<any[]>('trips.listPublished');
      return rows.map(mapTrip);
    },
  });
}

export function useTrip(id: string | undefined) {
  return useQuery({
    queryKey: ['trips', id],
    queryFn: async () => {
      const row = await callApi<any>('trips.get', { id });
      if (!row) throw new Error('Trip not found');
      return mapTrip(row);
    },
    enabled: !!id,
  });
}

export function useCreateTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (trip: Omit<Trip, 'id' | 'created_at' | 'updated_at'>) =>
      mapTrip(await callApi('trips.save', trip as Record<string, unknown>)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trips'] }),
  });
}

export function useUpdateTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Trip> & { id: string }) =>
      mapTrip(await callApi('trips.save', { id, ...updates })),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({ queryKey: ['trips', data.id] });
    },
  });
}

// Combined save (create or update) for compatibility with CreateTripPage
export function useSaveTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (trip: Partial<Trip> & { id?: string }) =>
      mapTrip(await callApi('trips.save', trip as Record<string, unknown>)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trips'] }),
  });
}

// Duplicera en hel resa (utom anmälningar). Kopian sätts till draft med "(kopia)".
export function useDuplicateTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<Trip> => mapTrip(await callApi('trips.duplicate', { id })),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trips'] }),
  });
}

export function useDeleteTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await callApi('trips.delete', { id });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trips'] }),
  });
}
