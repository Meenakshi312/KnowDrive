import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/db/auth-server";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/db/supabase";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ user: null, authenticated: false }, { status: 401 });
    }
    return NextResponse.json({ user, authenticated: true });
  } catch (error) {
    return NextResponse.json({ user: null, authenticated: false }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { full_name } = body;

    const trimmedName = typeof full_name === "string" ? full_name.trim() : user.full_name;

    if (!user.isDemo && isSupabaseConfigured) {
      const supabase = getSupabaseServerClient();
      if (supabase) {
        const { error } = await supabase
          .from("profiles")
          .update({
            full_name: trimmedName,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id);

        if (error) {
          console.error("Supabase profile update error:", error);
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        ...user,
        full_name: trimmedName,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update profile" }, { status: 500 });
  }
}
