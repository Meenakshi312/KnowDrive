import { NextRequest, NextResponse } from "next/server";
import { KnowDriveRepository } from "@/lib/db/repository";
import { getCurrentUser } from "@/lib/db/auth-server";
import { FileType } from "@/types";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const folderId = searchParams.get("folder_id");
    const isStarred = searchParams.get("starred") === "true" ? true : undefined;
    const isTrashed = searchParams.get("trashed") === "true";
    const fileType = (searchParams.get("type") as FileType) || undefined;
    const searchQuery = searchParams.get("q") || undefined;

    const repo = new KnowDriveRepository(user.id, user.isDemo);
    const files = await repo.getFiles({
      folderId: folderId === "root" ? null : folderId || undefined,
      isStarred,
      isTrashed,
      fileType,
      searchQuery,
    });

    const storageStats = await repo.getStorageBreakdown();

    return NextResponse.json({ files, storageStats, user });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch files";
    console.error("Fetch files error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
