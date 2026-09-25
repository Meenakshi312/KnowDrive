import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseUrl.startsWith("http") &&
  supabaseAnonKey &&
  !supabaseUrl.includes("your-project")
);

export function getSupabaseBrowserClient() {
  if (!isSupabaseConfigured) return null;
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
