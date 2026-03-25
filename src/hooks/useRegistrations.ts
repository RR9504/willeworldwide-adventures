import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Registration, PaymentStatus } from '@/types/trip';

function mapRegistration(row: any): Registration {
  return {
    ...row,
    form_data: (row.form_data || {}) as Record<string, any>,
    presentation_data: row.presentation_data as Record<string, string> | undefined,
    payment_status: row.payment_status as PaymentStatus,
  };
}

export function useRegistrations(tripId?: string) {
  return useQuery({
    queryKey: ['registrations', { tripId }],
    queryFn: async () => {
      let query = supabase
        .from('registrations')
        .select('*')
        .order('created_at', { ascending: true });
      if (tripId) {
        query = query.eq('trip_id', tripId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map(mapRegistration);
    },
  });
}

export function useAllRegistrations() {
  return useQuery({
    queryKey: ['registrations', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('registrations')
        .select('id, trip_id, payment_status, presentation_data, form_data, created_at')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []).map(mapRegistration);
    },
  });
}

export function useRegistration(regId: string | undefined, tripId?: string) {
  return useQuery({
    queryKey: ['registrations', regId],
    queryFn: async () => {
      let query = supabase
        .from('registrations')
        .select('*')
        .eq('id', regId!);
      if (tripId) {
        query = query.eq('trip_id', tripId);
      }
      const { data, error } = await query.single();
      if (error) throw error;
      return mapRegistration(data);
    },
    enabled: !!regId,
  });
}

export function useCreateRegistration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (reg: { trip_id: string; form_data: Record<string, any> }) => {
      const { data, error } = await supabase
        .from('registrations')
        .insert({
          trip_id: reg.trip_id,
          form_data: reg.form_data as any,
        })
        .select()
        .single();
      if (error) throw error;
      return mapRegistration(data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['registrations'] });
    },
  });
}

export function useUpdateRegistration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; payment_status?: PaymentStatus; payment_note?: string; presentation_data?: Record<string, string> }) => {
      const payload: Record<string, any> = {};
      if (updates.payment_status !== undefined) payload.payment_status = updates.payment_status;
      if (updates.payment_note !== undefined) payload.payment_note = updates.payment_note;
      if (updates.presentation_data !== undefined) payload.presentation_data = updates.presentation_data;

      const { data, error } = await supabase
        .from('registrations')
        .update(payload)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return mapRegistration(data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['registrations'] });
      queryClient.invalidateQueries({ queryKey: ['registrations', data.id] });
    },
  });
}
