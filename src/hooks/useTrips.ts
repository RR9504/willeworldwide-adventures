import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sql } from '@/lib/db';
import { Trip, TripCategory, TripStatus, FormField, PresentationQuestion } from '@/types/trip';

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
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function useTrips() {
  return useQuery({
    queryKey: ['trips'],
    queryFn: async () => {
      const rows = await sql`SELECT * FROM trips ORDER BY start_date DESC`;
      return rows.map(mapTrip);
    },
  });
}

export function useTrip(id: string | undefined) {
  return useQuery({
    queryKey: ['trips', id],
    queryFn: async () => {
      const rows = await sql`SELECT * FROM trips WHERE id = ${id!}`;
      if (rows.length === 0) throw new Error('Trip not found');
      return mapTrip(rows[0]);
    },
    enabled: !!id,
  });
}

export function useCreateTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (trip: Omit<Trip, 'id' | 'created_at' | 'updated_at'>) => {
      const rows = await sql`
        INSERT INTO trips (title, description, destination, category, start_date, end_date, price, currency, max_participants, show_spots_left, spots_left_threshold, image_url, image_position, status, form_fields, presentation_fields)
        VALUES (${trip.title}, ${trip.description}, ${trip.destination}, ${trip.category}, ${trip.start_date}, ${trip.end_date}, ${trip.price}, ${trip.currency}, ${trip.max_participants}, ${trip.show_spots_left}, ${trip.spots_left_threshold ?? null}, ${trip.image_url}, ${trip.image_position ?? null}, ${trip.status}, ${JSON.stringify(trip.form_fields)}, ${JSON.stringify(trip.presentation_fields)})
        RETURNING *
      `;
      return mapTrip(rows[0]);
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
      const rows = await sql`
        UPDATE trips SET
          title = COALESCE(${updates.title ?? null}, title),
          description = COALESCE(${updates.description ?? null}, description),
          destination = COALESCE(${updates.destination ?? null}, destination),
          category = COALESCE(${updates.category ?? null}, category),
          start_date = COALESCE(${updates.start_date ?? null}, start_date),
          end_date = COALESCE(${updates.end_date ?? null}, end_date),
          price = COALESCE(${updates.price ?? null}, price),
          currency = COALESCE(${updates.currency ?? null}, currency),
          max_participants = COALESCE(${updates.max_participants ?? null}, max_participants),
          show_spots_left = COALESCE(${updates.show_spots_left ?? null}, show_spots_left),
          spots_left_threshold = ${updates.spots_left_threshold ?? null},
          image_url = COALESCE(${updates.image_url ?? null}, image_url),
          image_position = ${updates.image_position ?? null},
          status = COALESCE(${updates.status ?? null}, status),
          form_fields = COALESCE(${updates.form_fields ? JSON.stringify(updates.form_fields) : null}, form_fields),
          presentation_fields = COALESCE(${updates.presentation_fields ? JSON.stringify(updates.presentation_fields) : null}, presentation_fields)
        WHERE id = ${id}
        RETURNING *
      `;
      return mapTrip(rows[0]);
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
      await sql`DELETE FROM trips WHERE id = ${id}`;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
    },
  });
}
