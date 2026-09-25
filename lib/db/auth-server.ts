import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { DEMO_USER_ID } from "./seed-data";
import { isSupabaseConfigured, getSupabaseServerClient } from "./supabase";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export interface AuthenticatedUser {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string | null;
  isDemo: boolean;
}

/**
 * Resolves the authenticated user from Next.js server context.
 * Checks for a live Supabase Auth session via cookies first,
 * then checks for the student demo guest cookie.
 */
export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  // If Supabase is unconfigured, automatically use the student demo user
  if (!isSupabaseConfigured) {
    return {
      id: DEMO_USER_ID,
      email: "alex.chen@student.portfolio",
      full_name: "Alex Chen (Demo)",
      isDemo: true,
    };
  }

  try {
    const cookieStore = await cookies();
    const isDemoCookie = cookieStore.get("knowdrive_demo_session")?.value === "true";

    // Guest demo mode: immediate resolution without external network round-trip
    if (isDemoCookie) {
      return {
        id: DEMO_USER_ID,
        email: "alex.chen@student.portfolio",
        full_name: "Alex Chen (Demo)",
        isDemo: true,
      };
    }

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Can be ignored if called from Server Component
          }
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const fullName =
        user.user_metadata?.full_name ||
        user.email?.split("@")[0] ||
        "Student User";

      // Ensure profile exists in public.profiles table to prevent foreign key errors (non-blocking)
      ensureUserProfile(user.id, user.email || "", fullName, user.user_metadata?.avatar_url).catch(() => {});

      return {
        id: user.id,
        email: user.email || "",
        full_name: fullName,
        avatar_url: user.user_metadata?.avatar_url || null,
        isDemo: false,
      };
    }

    return null;
  } catch (err) {
    console.error("Error resolving current user session:", err);
    return null;
  }
}

/**
 * Ensures a record exists in public.profiles for the given authenticated user
 */
export async function ensureUserProfile(
  userId: string,
  email: string,
  fullName: string,
  avatarUrl?: string | null
) {
  const admin = getSupabaseServerClient();
  if (!admin || !isSupabaseConfigured) return;

  try {
    await admin.from("profiles").upsert(
      {
        id: userId,
        email,
        full_name: fullName,
        avatar_url: avatarUrl || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );
  } catch (err) {
    console.warn("Could not upsert profile in Supabase:", err);
  }
}
