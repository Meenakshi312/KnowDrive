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

    const allCookies = cookieStore.getAll();
    const hasAuthCookie = allCookies.some(
      (c) => c.name.startsWith("sb-") && c.name.includes("-auth-token")
    );

    // If there is no Supabase auth token cookie, user is unauthenticated (return immediately in 0ms)
    if (!hasAuthCookie) {
      return null;
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

    // Guard with a 4-second timeout to prevent AuthRetryableFetchError from hanging the server for 26s
    const userPromise = supabase.auth.getUser();
    const timeoutPromise = new Promise<{ data: { user: null }; error: Error }>((resolve) =>
      setTimeout(
        () => resolve({ data: { user: null }, error: new Error("Auth session verification timed out") }),
        4000
      )
    );

    const {
      data: { user },
    } = await Promise.race([userPromise, timeoutPromise]);

    if (user) {
      let fullName =
        user.user_metadata?.full_name ||
        user.email?.split("@")[0] ||
        "Student User";
      let avatarUrl = user.user_metadata?.avatar_url || null;

      // Check public.profiles table for the latest updated display name
      const admin = getSupabaseServerClient();
      if (admin) {
        try {
          const { data: profile } = await admin
            .from("profiles")
            .select("full_name, avatar_url")
            .eq("id", user.id)
            .single();

          if (profile?.full_name) {
            fullName = profile.full_name;
          }
          if (profile?.avatar_url) {
            avatarUrl = profile.avatar_url;
          }
        } catch (e) {
          // Fall back to metadata
        }
      }

      // Ensure profile exists in public.profiles table without overwriting customized name
      ensureUserProfile(user.id, user.email || "", fullName, avatarUrl).catch(() => {});

      return {
        id: user.id,
        email: user.email || "",
        full_name: fullName,
        avatar_url: avatarUrl,
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
 * Ensures a record exists in public.profiles for the given authenticated user without overwriting existing data
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
    const { data: existing } = await admin.from("profiles").select("id").eq("id", userId).single();
    if (!existing) {
      await admin.from("profiles").insert({
        id: userId,
        email,
        full_name: fullName,
        avatar_url: avatarUrl || null,
        updated_at: new Date().toISOString(),
      });
    }
  } catch (err) {
    console.warn("Could not ensure profile in Supabase:", err);
  }
}
