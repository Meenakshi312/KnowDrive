import { NextRequest, NextResponse } from "next/server";
import { KnowDriveRepository } from "@/lib/db/repository";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/db/supabase";
import { extractDocumentText } from "@/lib/processors/text-extractor";
import { chunkDocument } from "@/lib/processors/chunker";
import { generateEmbedding } from "@/lib/ai/embeddings";
import { isGeminiConfigured } from "@/lib/ai/client";
import { getCurrentUser } from "@/lib/db/auth-server";

export async function POST(req: NextRequest) {
  let targetFileId: string | null = null;
  let ownerRepo: KnowDriveRepository | null = null;

  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fileId } = await req.json();
    if (!fileId) {
      return NextResponse.json({ error: "fileId is required" }, { status: 400 });
    }
    targetFileId = fileId;

    const lookupRepo = new KnowDriveRepository(user.id, user.isDemo);
    const ownedFile = await lookupRepo.getFileById(fileId);
    const adminRepo = new KnowDriveRepository(user.id, false);
    const file = ownedFile || (user.isDemo ? await adminRepo.getFileByIdAdmin(fileId) : null);

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
    if (!user.isDemo && file.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const repo = new KnowDriveRepository(file.user_id, user.isDemo);
    ownerRepo = repo;

    await repo.updateFile(fileId, { processing_status: "processing", error_message: null });

    let buffer: Buffer | null = null;
    const supabase = getSupabaseServerClient();
    const bucketName = process.env.SUPABASE_STORAGE_BUCKET || "knowdrive-files";

    if (supabase && isSupabaseConfigured && file.storage_path && !file.storage_path.startsWith("demo/")) {
      try {
        const { data: fileBlob, error: downloadError } = await supabase.storage
          .from(bucketName)
          .download(file.storage_path);

        if (!downloadError && fileBlob) {
          buffer = Buffer.from(await fileBlob.arrayBuffer());
        }
      } catch (dlErr) {
        console.warn("Could not download file from Supabase Storage:", dlErr);
      }
    }

    if (!buffer) {
      throw new Error(
        "Could not read the uploaded file for indexing. Re-upload the document and try again."
      );
    }

    const extracted = await extractDocumentText(buffer, file.name, file.mime_type);
    if (!extracted.fullText || extracted.fullText.replace(/\s+/g, "").length < 20) {
      throw new Error(
        "No readable text could be extracted from this file. Scanned images need OCR, which is not enabled yet."
      );
    }

    const rawChunks = chunkDocument(extracted, 250, 35);
    if (rawChunks.length === 0) {
      throw new Error("Document chunking produced no searchable sections.");
    }

    const chunksWithEmbeddings = [];
    let embeddingFailures = 0;

    for (let i = 0; i < rawChunks.length; i++) {
      const rc = rawChunks[i];
      let embedding: number[] | undefined;
      if (isGeminiConfigured) {
        try {
          embedding = await generateEmbedding(rc.chunk_text, "RETRIEVAL_DOCUMENT");
        } catch (embedErr) {
          embeddingFailures += 1;
          console.warn(`Embedding failed for chunk ${i} of ${file.name}:`, embedErr);
        }
      } else {
        embeddingFailures += 1;
      }

      chunksWithEmbeddings.push({
        document_id: "",
        file_id: file.id,
        user_id: file.user_id,
        chunk_index: rc.chunk_index,
        chunk_text: rc.chunk_text,
        page_number: rc.page_number,
        token_count: rc.token_count,
        embedding,
        metadata: rc.metadata,
      });
    }

    const result = await repo.saveDocumentAndChunks(
      {
        file_id: file.id,
        user_id: file.user_id,
        title: extracted.title,
        page_count: extracted.pageCount,
        word_count: extracted.wordCount,
        extracted_text: extracted.fullText.slice(0, 20000),
      },
      chunksWithEmbeddings
    );

    const embeddingNote =
      embeddingFailures > 0
        ? `Indexed ${result.chunks.length} chunks. Vector embeddings were unavailable for ${embeddingFailures} chunk(s); keyword search still works.`
        : null;

    await repo.updateFile(file.id, {
      processing_status: "ready",
      error_message: embeddingNote,
    });

    return NextResponse.json({
      success: true,
      fileId: file.id,
      chunksCount: result.chunks.length,
      pages: extracted.pageCount,
      embeddingsIndexed: result.chunks.length - embeddingFailures,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Processing failed";
    console.error("Document processing error:", error);

    if (targetFileId && ownerRepo) {
      await ownerRepo.updateFile(targetFileId, {
        processing_status: "failed",
        error_message: message,
      });
    }

    return NextResponse.json({ error: "Document processing failed. Please try uploading again." }, { status: 500 });
  }
}
