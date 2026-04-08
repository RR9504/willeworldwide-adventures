import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sql } from '@/lib/db';
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
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function useRegistrations(tripId?: string) {
  return useQuery({
    queryKey: ['registrations', { tripId }],
    queryFn: async () => {
      const rows = tripId
        ? await sql`SELECT * FROM registrations WHERE trip_id = ${tripId} ORDER BY created_at ASC`
        : await sql`SELECT * FROM registrations ORDER BY created_at ASC`;
      return rows.map(mapRegistration);
    },
  });
}

export function useAllRegistrations() {
  return useQuery({
    queryKey: ['registrations', 'all'],
    queryFn: async () => {
      const rows = await sql`SELECT id, trip_id, payment_status, presentation_data, form_data, created_at FROM registrations ORDER BY created_at ASC`;
      return rows.map(mapRegistration);
    },
  });
}

export function useRegistration(regId: string | undefined, tripId?: string) {
  return useQuery({
    queryKey: ['registrations', regId],
    queryFn: async () => {
      const rows = tripId
        ? await sql`SELECT * FROM registrations WHERE id = ${regId!} AND trip_id = ${tripId}`
        : await sql`SELECT * FROM registrations WHERE id = ${regId!}`;
      if (rows.length === 0) throw new Error('Registration not found');
      return mapRegistration(rows[0]);
    },
    enabled: !!regId,
  });
}

export function useCreateRegistration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (reg: { trip_id: string; form_data: Record<string, any> }) => {
      const rows = await sql`
        INSERT INTO registrations (trip_id, form_data)
        VALUES (${reg.trip_id}, ${JSON.stringify(reg.form_data)})
        RETURNING *
      `;
      return mapRegistration(rows[0]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registrations'] });
    },
  });
}

export function useCreateRegistrations() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (regs: { trip_id: string; form_data: Record<string, any> }[]) => {
      const results: Registration[] = [];
      for (const reg of regs) {
        const rows = await sql`
          INSERT INTO registrations (trip_id, form_data)
          VALUES (${reg.trip_id}, ${JSON.stringify(reg.form_data)})
          RETURNING *
        `;
        results.push(mapRegistration(rows[0]));
      }
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registrations'] });
    },
  });
}

export function useUpdateRegistration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; payment_status?: PaymentStatus; payment_note?: string; presentation_data?: Record<string, string> }) => {
      const rows = await sql`
        UPDATE registrations SET
          payment_status = COALESCE(${updates.payment_status ?? null}, payment_status),
          payment_note = COALESCE(${updates.payment_note ?? null}, payment_note),
          presentation_data = COALESCE(${updates.presentation_data ? JSON.stringify(updates.presentation_data) : null}, presentation_data)
        WHERE id = ${id}
        RETURNING *
      `;
      return mapRegistration(rows[0]);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['registrations'] });
      queryClient.invalidateQueries({ queryKey: ['registrations', data.id] });
    },
  });
}
