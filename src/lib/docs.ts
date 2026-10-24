import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Doc = { id: string; category: string; title: string; html: string; created_at: string };

export const docsQuery = queryOptions({
  queryKey: ["documents"],
  queryFn: async (): Promise<Doc[]> => {
    const { data, error } = await supabase
      .from("documents")
      .select("id, category, title, html, created_at")
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data ?? [];
  },
});

export async function authHeader(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const t = data.session?.access_token;
  return t ? { Authorization: `Bearer ${t}` } : {};
}
