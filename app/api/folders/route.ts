import { NextRequest, NextResponse } from "next/server";
import { KnowDriveRepository } from "@/lib/db/repository";
import { getCurrentUser } from "@/lib/db/auth-server";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const parentId = searchParams.get("parent_id");

    const repo = new KnowDriveRepository(user.id, user.isDemo);
    const folders = await repo.getFolders(parentId);
    return NextResponse.json({ folders });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch folders";
    console.error("Fetch folders error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, parent_id, color } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Folder name is required" }, { status: 400 });
    }

    const repo = new KnowDriveRepository(user.id, user.isDemo);
    const folder = await repo.createFolder(name, parent_id, color);
    return NextResponse.json({ success: true, folder });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create folder";
    console.error("Create folder error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const folderId = searchParams.get("id");

    if (!folderId) {
      return NextResponse.json({ error: "Folder ID required" }, { status: 400 });
    }

    const repo = new KnowDriveRepository(user.id, user.isDemo);
    await repo.deleteFolder(folderId);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete folder";
    console.error("Delete folder error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
