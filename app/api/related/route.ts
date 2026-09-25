import { NextRequest, NextResponse } from "next/server";
import { KnowDriveRepository } from "@/lib/db/repository";
import { searchChunksBySimilarity, EMBEDDING_DIMENSION } from "@/lib/ai/embeddings";
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
    const sourceChunks = await repo.getChunksByFile(fileId);

    if (sourceChunks.length === 0) {
      return NextResponse.json({ relatedFiles: [] });
    }

    // Use primary chunk embedding as reference
    const primaryChunk = sourceChunks[0];
    if (!primaryChunk.embedding || primaryChunk.embedding.length !== EMBEDDING_DIMENSION) {
      return NextResponse.json({
        relatedFiles: [],
        notice: "Document has not yet been indexed with 768-dim Gemini vector embeddings.",
      });
    }

    const refVector = primaryChunk.embedding;
    const otherChunks = repo.getAllChunks().filter((c) => c.file_id !== fileId);
    const matchedChunks = searchChunksBySimilarity(otherChunks, refVector, 8, 0.25);

    const relatedFileIds = Array.from(new Set(matchedChunks.map((c) => c.file_id)));
    const allFiles = await repo.getFiles({ isTrashed: false });
    const relatedFiles = allFiles.filter((f) => relatedFileIds.includes(f.id));

    return NextResponse.json({ relatedFiles });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to find related files";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
