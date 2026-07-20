import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { callApi } from '@/lib/api';
import { Registration, PaymentStatus } from '@/types/trip';

function mapRegistration(row: any): Registration {
  return {
    id: row.id,
    trip_id: row.trip_id,
    form_data: (typeof row.form_data === 'string' ? JSON.parse(row.form_data) : row.form_data) as Record<string, any>,
    presentation_data: row.presentation_data
      ? (typeof row.presentation_data === 'string' ? JSON.parse(row.presentation_data) : row.presentation_data) as Record<string, string>
      : undefined,
    payment_status: row.payment_status as PaymentStatus,
    payment_note: row.payment_note ?? undefined,
    ai_summary: row.ai_summary ?? undefined,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function useRegistrations(tripId?: string) {
  return useQuery({
    queryKey: ['registrations', { tripId }],
    queryFn: async () => {
      const rows = await callApi<any[]>('registrations.list', tripId ? { tripId } : {});
      return rows.map(mapRegistration);
    },
  });
}

export function useAllRegistrations() {
  return useQuery({
    queryKey: ['registrations', 'all'],
    queryFn: async () => {
      const rows = await callApi<any[]>('registrations.list', {});
      return rows.map(mapRegistration);
    },
  });
}

/**
 * Antal anmälningar per resa – returnerar ENDAST antal (aldrig personuppgifter).
 * Publik action, säker för "platser kvar" på startsidan.
 */
export function useTripRegistrationCounts() {
  return useQuery({
    queryKey: ['registrations', 'counts'],
    queryFn: async () => {
      const rows = await callApi<{ trip_id: string; n: number }[]>('trips.counts');
      const counts: Record<string, number> = {};
      for (const r of rows) counts[r.trip_id] = r.n;
      return counts;
    },
  });
}

export function useRegistration(regId: string | undefined) {
  return useQuery({
    queryKey: ['registrations', regId],
    queryFn: async () => {
      const row = await callApi<any>('registrations.get', { id: regId });
      if (!row) throw new Error('Registration not found');
      return mapRegistration(row);
    },
    enabled: !!regId,
  });
}

/** Publik: hämtar EN anmälan via dess UUID (capability-länk för registranten). */
export function useRegistrationById(regId: string | undefined) {
  return useQuery({
    queryKey: ['registration-own', regId],
    queryFn: async () => {
      const row = await callApi<any>('registrations.getOne', { id: regId });
      return row ? mapRegistration(row) : null;
    },
    enabled: !!regId,
  });
}

/** Publik: registranten uppdaterar sina egna fält (form_data/presentation_data). */
export function useUpdateOwnRegistration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, form_data, presentation_data }: { id: string; form_data?: Record<string, any>; presentation_data?: Record<string, string> }) =>
      mapRegistration(await callApi('registrations.updateOwn', { id, form_data, presentation_data })),
    onSuccess: (data) => queryClient.invalidateQueries({ queryKey: ['registration-own', data.id] }),
  });
}

export function useCreateRegistration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (reg: { trip_id: string; form_data: Record<string, any>; presentation_data?: Record<string, string> }) =>
      mapRegistration(await callApi('registrations.create', reg)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['registrations'] }),
  });
}

export function useCreateRegistrations() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (regs: { trip_id: string; form_data: Record<string, any>; presentation_data?: Record<string, string> }[]) => {
      const rows = await callApi<any[]>('registrations.createMany', { regs });
      return rows.map(mapRegistration);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['registrations'] }),
  });
}

export function useDeleteRegistration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await callApi('registrations.delete', { id });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['registrations'] }),
  });
}

export function useUpdateRegistration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; payment_status?: PaymentStatus; payment_note?: string; form_data?: Record<string, any>; presentation_data?: Record<string, string>; ai_summary?: string | null }) =>
      mapRegistration(await callApi('registrations.update', { id, ...updates })),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['registrations'] });
      queryClient.invalidateQueries({ queryKey: ['registrations', data.id] });
    },
  });
}
