import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

/** URL·anon key가 있으면 Supabase 클라이언트(실시간·Auth 확장용). 없으면 null */
export function getSupabase(): SupabaseClient | null {
  const url = import.meta.env.VITE_SUPABASE_URL?.trim();
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
  if (!url || !key) return null;
  if (!client) {
    client = createClient(url, key);
  }
  return client;
}
