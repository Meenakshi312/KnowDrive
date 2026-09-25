import { NextRequest, NextResponse } from "next/server";
import { KnowDriveRepository } from "@/lib/db/repository";
import { getCurrentUser } from "@/lib/db/auth-server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fileId } = await params;
    const repo = new KnowDriveRepository(user.id, user.isDemo);
    const file = await repo.getFileById(fileId);

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const document = await repo.getDocumentByFileId(fileId);
    const chunks = await repo.getChunksByFile(fileId);

    return NextResponse.json({ file, document, chunks });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error fetching file";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fileId } = await params;
    const body = await req.json();
    const repo = new KnowDriveRepository(user.id, user.isDemo);

    let updatedFile = null;

    if (body.action === "toggle_star") {
      updatedFile = await repo.toggleStar(fileId);
    } else if (body.action === "trash") {
      updatedFile = await repo.moveToTrash(fileId);
    } else if (body.action === "restore") {
      updatedFile = await repo.restoreFromTrash(fileId);
    } else if (body.name) {
      updatedFile = await repo.updateFile(fileId, { name: body.name.trim() });
    } else if (body.folder_id !== undefined) {
      updatedFile = await repo.updateFile(fileId, { folder_id: body.folder_id });
    } else {
      updatedFile = await repo.updateFile(fileId, body);
    }

    return NextResponse.json({ success: true, file: updatedFile });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update file";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fileId } = await params;
    const repo = new KnowDriveRepository(user.id, user.isDemo);
    const success = await repo.permanentlyDeleteFile(fileId);
    return NextResponse.json({ success });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete file";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
