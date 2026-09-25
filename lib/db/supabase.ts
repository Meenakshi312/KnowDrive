import { createClient } from "@supabase/supabase-js";
import { isSupabaseConfigured, getSupabaseBrowserClient } from "./supabase-browser";

export { isSupabaseConfigured, getSupabaseBrowserClient };

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// Server-side admin client (service role key, bypasses RLS for indexing / chunk processing)
export function getSupabaseServerClient() {
  if (!isSupabaseConfigured) return null;
  const key = supabaseServiceKey || supabaseAnonKey;
  return createClient(supabaseUrl, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
