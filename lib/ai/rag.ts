import { generateGroundedText } from "./client";
import { generateEmbedding, hybridSearchChunks } from "./embeddings";
import { getSupabaseServerClient, isSupabaseConfigured } from "../db/supabase";
import { KnowDriveRepository } from "../db/repository";
import { DocumentChunk, MessageCitation } from "@/types";

export interface RagContextResult {
  chunks: (DocumentChunk & { similarity: number })[];
  prompt: string;
  sources: {
    fileId: string;
    fileName: string;
    pageNumber: number;
    snippet: string;
    chunkId: string;
  }[];
}

/**
 * Retrieve relevant document chunks for the user's question, enforcing permission boundaries.
 * Uses pgvector cosine similarity search on the user's authorized chunks.
 */
export async function retrieveRagContext(
  repo: KnowDriveRepository,
  userId: string,
  query: string,
  targetFileIds?: string[],
  topK: number = 8
): Promise<RagContextResult> {
  const userFiles = await repo.getFiles({ isTrashed: false });
  const explicitTargets = (targetFileIds || []).filter(Boolean);
  const mentionedFileIds = explicitTargets.length > 0 ? [] : detectMentionedFiles(query, userFiles);
  const restrictToFileIds = explicitTargets.length > 0 ? explicitTargets : mentionedFileIds;

  // Calls generateEmbedding directly so that if Gemini is unconfigured and unmocked, it throws
  const queryEmbedding = await generateEmbedding(query, "RETRIEVAL_QUERY");

  let matchedChunks: (DocumentChunk & { similarity: number })[] = [];

  if (!repo.isDemo && isSupabaseConfigured && queryEmbedding) {
    matchedChunks = await searchWithPgvector(
      queryEmbedding,
      userId,
      restrictToFileIds,
      topK
    );
  }

  // If explicit targets were specified and vector search returned no chunks (or very few),
  // retrieve the chunks of that chosen file directly so questions about the chosen PDF can be answered.
  if (explicitTargets.length > 0 && matchedChunks.length === 0) {
    const fileChunks = await repo.getAuthorizedChunks(explicitTargets);
    if (fileChunks.length > 0) {
      matchedChunks = hybridSearchChunks(fileChunks, query, queryEmbedding, topK, 0);
      if (matchedChunks.length === 0) {
        matchedChunks = fileChunks.slice(0, topK).map((c, i) => ({
          ...c,
          similarity: 1 - i * 0.05,
        }));
      }
    }
  }

  // For in-memory or demo mode
  if (matchedChunks.length === 0 && (repo.isDemo || !isSupabaseConfigured)) {
    const authorizedChunks = await repo.getAuthorizedChunks(restrictToFileIds);
    matchedChunks = hybridSearchChunks(authorizedChunks, query, queryEmbedding, topK, 0.15);
  }

  if (matchedChunks.length === 0) {
    return {
      chunks: [],
      prompt: "",
      sources: [],
    };
  }

  for (const chunk of matchedChunks) {
    if (!chunk.file_name) {
      const match = userFiles.find((f) => f.id === chunk.file_id) || (await repo.getFileById(chunk.file_id));
      chunk.file_name = match?.name || "Document";
    }
  }

  const sources = matchedChunks.map((chunk) => ({
    fileId: chunk.file_id,
    fileName: chunk.file_name || "Document",
    pageNumber: chunk.page_number || 1,
    snippet: chunk.chunk_text.slice(0, 220),
    chunkId: chunk.id,
  }));

  const contextFormatted = matchedChunks
    .map(
      (c, idx) =>
        `[Source ${idx + 1}: ${c.file_name || "Document"} (Page ${c.page_number || 1})]\n${c.chunk_text}`
    )
    .join("\n\n---\n\n");

  const prompt = `You are KnowDrive Assistant, an expert AI knowledge copilot. Answer the user's question using ONLY the provided document excerpts from their personal drive.

CRITICAL INSTRUCTIONS:
1. Provide a direct, concise, factual answer to the specific question asked. Answer only using the verified facts from the document excerpts.
2. DO NOT output the whole chunk, raw dump, or long unedited excerpts. Extract and state only the specific factual answer directly.
3. If the answer to the question is NOT present or cannot be supported by the provided document excerpts, you MUST reply with ONLY:
   "I couldn't find this information in your uploaded documents."
   Do NOT guess, infer, speculate, or use any outside knowledge.
4. When you provide an answer from the document excerpts, cite the document name and page number at the end of the sentence or paragraph in brackets: [filename.pdf — Page X].

DOCUMENT EXCERPTS:
${contextFormatted}

USER QUESTION:
${query}

YOUR ANSWER:`;

  return {
    chunks: matchedChunks,
    prompt,
    sources,
  };
}

export async function executeRagChat(
  repo: KnowDriveRepository,
  userId: string,
  query: string,
  targetFileIds?: string[]
): Promise<{ answer: string; citations: MessageCitation[] }> {
  const { chunks, prompt, sources } = await retrieveRagContext(repo, userId, query, targetFileIds);

  if (chunks.length === 0 || !prompt) {
    return {
      answer: "I couldn't find this information in your uploaded documents.",
      citations: [],
    };
  }

  let geminiAnswer = await generateGroundedText(prompt);

  // In test/demo mode where external API call is unavailable, provide grounded answer from matched chunks
  if (!geminiAnswer && repo.isDemo && chunks.length > 0) {
    const chunk = chunks[0];
    geminiAnswer = `Based on your document **${chunk.file_name || "Document"}**:\n\n${chunk.chunk_text.slice(0, 300)} [${chunk.file_name || "Document"} — Page ${chunk.page_number || 1}]`;
  }

  if (geminiAnswer) {
    const notFoundPhrases = [
      "i couldn't find this information in your uploaded documents",
      "i couldn't find enough information",
      "i could not find this information",
      "not present in the provided document excerpts",
      "not mentioned in the provided excerpts",
      "not found in your stored documents",
    ];
    const isNotFound = notFoundPhrases.some((phrase) =>
      geminiAnswer.toLowerCase().includes(phrase)
    );

    if (isNotFound) {
      return {
        answer: "I couldn't find this information in your uploaded documents.",
        citations: [],
      };
    }

    return {
      answer: geminiAnswer,
      citations: generateCitationsFromSources(sources, chunks, geminiAnswer),
    };
  }

  return {
    answer: "I couldn't find this information in your uploaded documents.",
    citations: [],
  };
}

function detectMentionedFiles(
  query: string,
  files: { id: string; name: string }[]
): string[] {
  const lowerQuery = query.toLowerCase();
  return files
    .filter((f) => {
      const name = f.name.toLowerCase();
      const baseName = f.name.replace(/\.[^.]+$/, "").toLowerCase();
      const spaced = baseName.replace(/[_-]+/g, " ").replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
      if (spaced.length < 5) return false;
      return (
        lowerQuery.includes(name) ||
        lowerQuery.includes(baseName) ||
        lowerQuery.includes(spaced)
      );
    })
    .map((f) => f.id);
}

async function searchWithPgvector(
  queryEmbedding: number[],
  userId: string,
  filterFileIds: string[],
  topK: number
): Promise<(DocumentChunk & { similarity: number })[]> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return [];

  const threshold = filterFileIds.length > 0 ? 0.05 : 0.18;

  const { data, error } = await supabase.rpc("match_document_chunks", {
    query_embedding: queryEmbedding,
    match_threshold: threshold,
    match_count: topK,
    filter_user_id: userId,
    filter_file_ids: filterFileIds.length > 0 ? filterFileIds : null,
  });

  if (error) {
    console.warn("pgvector match_document_chunks failed:", error.message);
    return [];
  }
  if (!data || data.length === 0) return [];

  return data.map(
    (d: {
      id: string;
      document_id: string;
      file_id: string;
      file_name: string;
      page_number: number;
      chunk_text: string;
      similarity: number;
    }) => ({
      id: d.id,
      document_id: d.document_id,
      file_id: d.file_id,
      user_id: userId,
      chunk_index: 0,
      chunk_text: d.chunk_text,
      page_number: d.page_number,
      token_count: Math.ceil(d.chunk_text.length / 4),
      file_name: d.file_name,
      similarity: d.similarity,
      created_at: new Date().toISOString(),
    })
  );
}

function generateCitationsFromSources(
  sources: { fileId: string; fileName: string; pageNumber: number; snippet: string; chunkId: string }[],
  chunks: DocumentChunk[] = [],
  answerText?: string
): MessageCitation[] {
  const citations: MessageCitation[] = [];
  const seen = new Set<string>();

  for (const s of sources) {
    const key = `${s.fileId}-${s.fileName}-${s.pageNumber}`;
    if (seen.has(key)) continue;
    seen.add(key);

    if (answerText) {
      const fileMentioned =
        answerText.toLowerCase().includes(s.fileName.toLowerCase()) ||
        answerText.toLowerCase().includes(s.fileName.replace(/\.[^.]+$/, "").toLowerCase());
      if (!fileMentioned && sources.length > 2) {
        continue;
      }
    }

    const chunk = chunks.find((c) => c.id === s.chunkId);
    citations.push({
      id: "cit-" + Math.random().toString(36).substring(2, 9),
      message_id: "",
      file_id: s.fileId || chunk?.file_id || "",
      chunk_id: s.chunkId,
      document_id: chunk?.document_id,
      file_name: s.fileName,
      page_number: s.pageNumber,
      snippet: s.snippet,
      relevance_score: 0.95,
    });
  }

  if (citations.length === 0 && sources.length > 0) {
    for (const s of sources.slice(0, 2)) {
      const chunk = chunks.find((c) => c.id === s.chunkId);
      citations.push({
        id: "cit-" + Math.random().toString(36).substring(2, 9),
        message_id: "",
        file_id: s.fileId || chunk?.file_id || "",
        chunk_id: s.chunkId,
        document_id: chunk?.document_id,
        file_name: s.fileName,
        page_number: s.pageNumber,
        snippet: s.snippet,
        relevance_score: 0.95,
      });
    }
  }

  return citations.slice(0, 6);
}
