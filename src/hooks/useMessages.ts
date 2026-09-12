import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { callApi } from '@/lib/api';
import { MessageLogEntry } from '@/lib/messaging';

export interface MessageLogFilter {
  trip_id?: string;
  registration_id?: string;
  limit?: number;
}

/** Utskicksloggen (admin). Nyast först. */
export function useMessageLog(filter: MessageLogFilter = {}, enabled = true) {
  return useQuery({
    queryKey: ['messages', filter],
    queryFn: () => callApi<MessageLogEntry[]>('messages.list', { ...filter }),
    enabled,
  });
}

/** Skickar om en loggad rad; det nya försöket loggas som en egen rad. */
export function useResendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      callApi<{ success: boolean; error?: string; row: MessageLogEntry | null }>('messages.resend', { id }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['messages'] }),
  });
}
