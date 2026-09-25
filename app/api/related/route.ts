import { NextRequest, NextResponse } from "next/server";
import { KnowDriveRepository } from "@/lib/db/repository";
import { hybridSearchChunks, EMBEDDING_DIMENSION, parseEmbedding } from "@/lib/ai/embeddings";
import { getCurrentUser } from "@/lib/db/auth-server";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const fileId = searchParams.get("file_id");

    if (!fileId) {
      return NextResponse.json({ error: "file_id is required" }, { status: 400 });
    }

    const repo = new KnowDriveRepository(user.id, user.isDemo);
    const sourceFile = await repo.getFileById(fileId);
    if (!sourceFile) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const sourceChunks = await repo.getChunksByFile(fileId);
    if (sourceChunks.length === 0) {
      return NextResponse.json({ relatedFiles: [] });
    }

    const sourceText = sourceChunks.map((c) => c.chunk_text).join(" ").slice(0, 4000);
    const primaryEmbedding =
      sourceChunks.map((c) => parseEmbedding(c.embedding)).find((e) => e && e.length === EMBEDDING_DIMENSION) ||
      null;

    const otherChunks = (await repo.getAuthorizedChunks()).filter((c) => c.file_id !== fileId);
    const matchedChunks = hybridSearchChunks(otherChunks, sourceText.slice(0, 800), primaryEmbedding, 10, 0.12);

    const relatedFileIds = Array.from(new Set(matchedChunks.map((c) => c.file_id)));
    const allFiles = await repo.getFiles({ isTrashed: false });
    const relatedFiles = allFiles.filter((f) => relatedFileIds.includes(f.id));

    return NextResponse.json({ relatedFiles });
  } catch (error: unknown) {
    console.error("Related files error:", error);
    return NextResponse.json({ error: "Failed to find related files" }, { status: 500 });
  }
}
