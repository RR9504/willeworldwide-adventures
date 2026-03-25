import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Trip, Registration } from '@/types/trip';

// Fetch all trips (admin sees all, public sees published)
export const useTrips = () => {
  return useQuery({
    queryKey: ['trips'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .order('start_date', { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as Trip[];
    },
  });
};

export const useTrip = (id: string | undefined) => {
  return useQuery({
    queryKey: ['trips', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as Trip | null;
    },
    enabled: !!id,
  });
};

export const useRegistrations = (tripId?: string) => {
  return useQuery({
    queryKey: ['registrations', tripId],
    queryFn: async () => {
      let query = supabase.from('registrations').select('*').order('created_at', { ascending: true });
      if (tripId) query = query.eq('trip_id', tripId);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as Registration[];
    },
  });
};

export const useAllRegistrations = () => {
  return useQuery({
    queryKey: ['registrations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('registrations')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as Registration[];
    },
  });
};

export const useSaveTrip = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (trip: Partial<Trip> & { id?: string }) => {
      const { id, ...rest } = trip;
      if (id) {
        const { data, error } = await supabase
          .from('trips')
          .update(rest as any)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('trips')
          .insert(rest as any)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
    },
  });
};

export const useCreateRegistration = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (reg: { trip_id: string; form_data: Record<string, any> }) => {
      const { data, error } = await supabase
        .from('registrations')
        .insert(reg as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registrations'] });
    },
  });
};

export const useUpdateRegistration = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { data, error } = await supabase
        .from('registrations')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registrations'] });
    },
  });
};
