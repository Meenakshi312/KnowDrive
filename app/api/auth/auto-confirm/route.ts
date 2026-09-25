import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/db/supabase";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const admin = getSupabaseServerClient();
    if (!admin) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    // List users to find matching email
    const { data, error } = await admin.auth.admin.listUsers();
    if (error) {
      console.error("List users error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const targetUser = data.users.find(
      (u) => u.email?.toLowerCase() === email.trim().toLowerCase()
    );

    if (targetUser) {
      const { error: updateErr } = await admin.auth.admin.updateUserById(targetUser.id, {
        email_confirm: true,
      });

      if (updateErr) {
        console.error("Auto-confirm error:", updateErr);
        return NextResponse.json({ error: updateErr.message }, { status: 500 });
      }

      // Ensure profile exists in profiles table
      await admin.from("profiles").upsert(
        {
          id: targetUser.id,
          email: targetUser.email || email,
          full_name:
            targetUser.user_metadata?.full_name ||
            email.split("@")[0] ||
            "Student User",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );

      return NextResponse.json({ success: true, confirmed: true, userId: targetUser.id });
    }

    return NextResponse.json({ error: "User not found" }, { status: 404 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Auto-confirm failed";
    console.error("Auto-confirm error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
