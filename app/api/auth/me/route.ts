import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/db/auth-server";

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
