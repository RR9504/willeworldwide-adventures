import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { callApi } from '@/lib/api';
import { getFieldDefault } from '@/data/editableContent';

export type PageOverride = Record<string, string>;

async function fetchOverride(slug: string): Promise<PageOverride> {
  const content = await callApi<PageOverride>('pageContent.get', { slug });
  return content ?? {};
}

/**
 * Läser en sidas texter. `t(key)` returnerar sparad text om den finns,
 * annars standardtexten från registret.
 */
export function usePageContent(slug: string) {
  const query = useQuery({
    queryKey: ['page_content', slug],
    queryFn: () => fetchOverride(slug),
  });

  const override = query.data ?? {};
  const t = (key: string): string => {
    const v = override[key];
    return v !== undefined && v !== '' ? v : getFieldDefault(slug, key);
  };

  return { t, override, isLoading: query.isLoading };
}

/** Hämtar råa överskrivningar för editorn (utan fallback-sammanslagning). */
export function usePageOverride(slug: string) {
  return useQuery({
    queryKey: ['page_content', slug],
    queryFn: () => fetchOverride(slug),
  });
}

export function useSavePageContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ slug, content }: { slug: string; content: PageOverride }) => {
      await callApi('pageContent.save', { slug, content });
      return content;
    },
    onSuccess: (_data, { slug }) => {
      queryClient.invalidateQueries({ queryKey: ['page_content', slug] });
    },
  });
}
