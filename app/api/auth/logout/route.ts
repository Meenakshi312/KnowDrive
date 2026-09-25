import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabaseServerClient } from "@/lib/db/supabase";

export async function POST() {
  try {
    const cookieStore = await cookies();

    // Clear demo session cookie
    cookieStore.delete("knowdrive_demo_session");

    // Clear Supabase auth cookies if any
    const allCookies = cookieStore.getAll();
    allCookies.forEach((c) => {
      if (c.name.startsWith("sb-")) {
        cookieStore.delete(c.name);
      }
    });

    const supabase = getSupabaseServerClient();
    if (supabase) {
      await supabase.auth.signOut().catch(() => {});
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json({ success: true });
  }
}
