import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sql } from '@/lib/db';
import { getFieldDefault } from '@/data/editableContent';

export type PageOverride = Record<string, string>;

async function fetchOverride(slug: string): Promise<PageOverride> {
  const rows = await sql`SELECT content FROM page_content WHERE slug = ${slug}`;
  if (rows.length === 0) return {};
  const c = rows[0].content;
  return (typeof c === 'string' ? JSON.parse(c) : c) as PageOverride;
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
      await sql`
        INSERT INTO page_content (slug, content, updated_at)
        VALUES (${slug}, ${JSON.stringify(content)}::jsonb, now())
        ON CONFLICT (slug) DO UPDATE SET content = EXCLUDED.content, updated_at = now()
      `;
      return content;
    },
    onSuccess: (_data, { slug }) => {
      queryClient.invalidateQueries({ queryKey: ['page_content', slug] });
    },
  });
}
