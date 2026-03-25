import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Trip, TripCategory, TripStatus, FormField, PresentationQuestion } from '@/types/trip';

function mapTrip(row: any): Trip {
  return {
    ...row,
    form_fields: (row.form_fields || []) as FormField[],
    presentation_fields: (row.presentation_fields || []) as PresentationQuestion[],
    category: row.category as TripCategory,
    status: row.status as TripStatus,
  };
}

export function useTrips() {
  return useQuery({
    queryKey: ['trips'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .order('start_date', { ascending: false });
      if (error) throw error;
      return (data || []).map(mapTrip);
    },
  });
}

export function useTrip(id: string | undefined) {
  return useQuery({
    queryKey: ['trips', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return mapTrip(data);
    },
    enabled: !!id,
  });
}

export function useCreateTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (trip: Omit<Trip, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('trips')
        .insert({
          title: trip.title,
          description: trip.description,
          destination: trip.destination,
          category: trip.category,
          start_date: trip.start_date,
          end_date: trip.end_date,
          price: trip.price,
          currency: trip.currency,
          max_participants: trip.max_participants,
          show_spots_left: trip.show_spots_left,
          spots_left_threshold: trip.spots_left_threshold ?? null,
          image_url: trip.image_url,
          image_position: trip.image_position ?? null,
          status: trip.status,
          form_fields: trip.form_fields as any,
          presentation_fields: trip.presentation_fields as any,
        })
        .select()
        .single();
      if (error) throw error;
      return mapTrip(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
    },
  });
}

export function useUpdateTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Trip> & { id: string }) => {
      const payload: Record<string, any> = {};
      if (updates.title !== undefined) payload.title = updates.title;
      if (updates.description !== undefined) payload.description = updates.description;
      if (updates.destination !== undefined) payload.destination = updates.destination;
      if (updates.category !== undefined) payload.category = updates.category;
      if (updates.start_date !== undefined) payload.start_date = updates.start_date;
      if (updates.end_date !== undefined) payload.end_date = updates.end_date;
      if (updates.price !== undefined) payload.price = updates.price;
      if (updates.currency !== undefined) payload.currency = updates.currency;
      if (updates.max_participants !== undefined) payload.max_participants = updates.max_participants;
      if (updates.show_spots_left !== undefined) payload.show_spots_left = updates.show_spots_left;
      if (updates.spots_left_threshold !== undefined) payload.spots_left_threshold = updates.spots_left_threshold;
      if (updates.image_url !== undefined) payload.image_url = updates.image_url;
      if (updates.image_position !== undefined) payload.image_position = updates.image_position;
      if (updates.status !== undefined) payload.status = updates.status;
      if (updates.form_fields !== undefined) payload.form_fields = updates.form_fields;
      if (updates.presentation_fields !== undefined) payload.presentation_fields = updates.presentation_fields;

      const { data, error } = await supabase
        .from('trips')
        .update(payload)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return mapTrip(data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({ queryKey: ['trips', data.id] });
    },
  });
}

export function useDeleteTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('trips')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
    },
  });
}
