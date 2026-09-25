import { NextRequest, NextResponse } from "next/server";
import { KnowDriveRepository } from "@/lib/db/repository";
import { compareDocuments } from "@/lib/ai/comparison";
import { getCurrentUser } from "@/lib/db/auth-server";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fileIds } = await req.json();

    if (!fileIds || !Array.isArray(fileIds) || fileIds.length < 2) {
      return NextResponse.json(
        { error: "At least two file IDs are required for comparison." },
        { status: 400 }
      );
    }

    const repo = new KnowDriveRepository(user.id, user.isDemo);
    const result = await compareDocuments(repo, fileIds);

    return NextResponse.json({ success: true, comparison: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Comparison failed";
    console.error("Comparison API error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
