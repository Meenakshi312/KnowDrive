import { NextRequest, NextResponse } from "next/server";
import { KnowDriveRepository } from "@/lib/db/repository";
import { tryGenerateQueryEmbedding, hybridSearchChunks } from "@/lib/ai/embeddings";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/db/supabase";
import { getCurrentUser } from "@/lib/db/auth-server";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";
    const isSemantic = searchParams.get("semantic") === "true";

    if (!query.trim()) {
      return NextResponse.json({ files: [], chunks: [] });
    }

    const repo = new KnowDriveRepository(user.id, user.isDemo);

    if (isSemantic) {
      const queryEmbedding = await tryGenerateQueryEmbedding(query);
      let matchedChunks: { file_id: string; similarity: number; chunk_text: string }[] = [];

      if (!user.isDemo && isSupabaseConfigured && queryEmbedding) {
        const supabase = getSupabaseServerClient();
        if (supabase) {
          const { data, error } = await supabase.rpc("match_document_chunks", {
            query_embedding: queryEmbedding,
            match_threshold: 0.12,
            match_count: 12,
            filter_user_id: user.id,
            filter_file_ids: null,
          });
          if (!error && data && data.length > 0) {
            matchedChunks = data.map((d: { file_id: string; similarity: number; chunk_text: string }) => ({
              file_id: d.file_id,
              similarity: d.similarity,
              chunk_text: d.chunk_text,
            }));
          }
        }
      }

      if (matchedChunks.length === 0) {
        const allChunks = await repo.getAuthorizedChunks();
        matchedChunks = hybridSearchChunks(allChunks, query, queryEmbedding, 12, 0.08);
      }

      const fileIdToSimilarity: Record<string, number> = {};
      matchedChunks.forEach((c) => {
        if (!fileIdToSimilarity[c.file_id] || c.similarity > fileIdToSimilarity[c.file_id]) {
          fileIdToSimilarity[c.file_id] = c.similarity;
        }
      });

      const allFiles = await repo.getFiles({ isTrashed: false });
      const matchedFiles = allFiles
        .filter((f) => fileIdToSimilarity[f.id] !== undefined)
        .sort((a, b) => (fileIdToSimilarity[b.id] || 0) - (fileIdToSimilarity[a.id] || 0));

      return NextResponse.json({
        files: matchedFiles,
        chunks: matchedChunks,
        isSemantic: true,
      });
    }

    const files = await repo.getFiles({ searchQuery: query, isTrashed: false });
    return NextResponse.json({ files, chunks: [], isSemantic: false });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Search failed";
    console.error("Search API error:", error);
    return NextResponse.json({ error: "Search failed. Please try again." }, { status: 500 });
  }
}
