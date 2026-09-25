import { describe, it, expect, vi } from "vitest";
import { KnowDriveRepository } from "@/lib/db/repository";
import { executeRagChat } from "@/lib/ai/rag";
import * as embeddings from "@/lib/ai/embeddings";
import {
  cosineSimilarity,
  generateEmbedding,
  searchChunksBySimilarity,
  EMBEDDING_DIMENSION,
  EMBEDDING_MODEL,
} from "@/lib/ai/embeddings";
import { DocumentChunk } from "@/types";

describe("Strict Gemini Embeddings, Vector Similarity Search, and Citations", () => {
  const repo = new KnowDriveRepository("00000000-0000-0000-0000-000000000001");

  it("ensures EMBEDDING_DIMENSION is 768 and model is gemini-embedding-001", () => {
    expect(EMBEDDING_DIMENSION).toBe(768);
    expect(EMBEDDING_MODEL).toBe("gemini-embedding-001");
  });

  it("throws clear error when Gemini API key is missing", async () => {
    // With no valid GEMINI_API_KEY, generateEmbedding must reject
    if (!process.env.GEMINI_API_KEY) {
      await expect(generateEmbedding("test text")).rejects.toThrow(
        "Gemini API is not configured"
      );
    }
  });

  it("calculates cosine similarity correctly for 768-dimensional vectors", () => {
    const vecA = new Array(768).fill(0);
    vecA[0] = 1;

    const vecB = new Array(768).fill(0);
    vecB[0] = 1;

    const vecC = new Array(768).fill(0);
    vecC[1] = 1;

    expect(cosineSimilarity(vecA, vecB)).toBeCloseTo(1.0, 4);
    expect(cosineSimilarity(vecA, vecC)).toBeCloseTo(0.0, 4);
  });

  it("enforces query embedding dimension of exactly 768 in searchChunksBySimilarity", () => {
    const invalidQueryVec = [0.1, 0.2]; // only 2 dims instead of 768
    const mockChunks: DocumentChunk[] = [];

    expect(() =>
      searchChunksBySimilarity(mockChunks, invalidQueryVec)
    ).toThrow("must be exactly 768 dimensions");
  });

  it("correctly ranks chunks with valid 768-dim embeddings and ignores chunks without embeddings", () => {
    const queryVec = new Array(768).fill(0);
    queryVec[0] = 1; // unit vector along dimension 0

    // Chunk 1 has 768-dim vector identical to query
    const chunk1Vec = new Array(768).fill(0);
    chunk1Vec[0] = 1;

    // Chunk 2 has 768-dim vector orthogonal to query
    const chunk2Vec = new Array(768).fill(0);
    chunk2Vec[1] = 1;

    const mockChunks: DocumentChunk[] = [
      {
        id: "chk-1",
        document_id: "doc-1",
        file_id: "file-1",
        user_id: "user-1",
        chunk_index: 0,
        chunk_text: "High match text",
        page_number: 1,
        token_count: 50,
        embedding: chunk1Vec,
      },
      {
        id: "chk-2",
        document_id: "doc-1",
        file_id: "file-1",
        user_id: "user-1",
        chunk_index: 1,
        chunk_text: "Zero match text",
        page_number: 2,
        token_count: 50,
        embedding: chunk2Vec,
      },
      {
        id: "chk-3",
        document_id: "doc-1",
        file_id: "file-1",
        user_id: "user-1",
        chunk_index: 2,
        chunk_text: "Unembedded text",
        page_number: 3,
        token_count: 50,
        // no embedding
      },
    ];

    const results = searchChunksBySimilarity(mockChunks, queryVec, 5, 0.1);

    // Only chunk 1 should match (similarity = 1.0)
    // chunk 3 (no embedding) is completely ignored without generating any fallback vector!
    expect(results.length).toBe(1);
    expect(results[0].id).toBe("chk-1");
    expect(results[0].similarity).toBeCloseTo(1.0, 4);
  });

  it("answers questions regarding the mentioned document with grounded citations", async () => {
    vi.spyOn(embeddings, "generateEmbedding").mockResolvedValue(new Array(768).fill(0.01));
    const result = await executeRagChat(
      repo,
      "00000000-0000-0000-0000-000000000001",
      "Summarize OpenFOAM CFD Thermal Simulation"
    );
    expect(result.answer).toContain("OpenFOAM");
    expect(result.citations.length).toBeGreaterThan(0);
    expect(result.citations[0].file_name).toContain("OpenFOAM");
  });

  it("answers questions for a specific targeted file ID directly", async () => {
    vi.spyOn(embeddings, "generateEmbedding").mockResolvedValue(new Array(768).fill(0.01));
    const result = await executeRagChat(
      repo,
      "00000000-0000-0000-0000-000000000001",
      "Who is the applicant and what are their qualifications?",
      ["file-resume"]
    );
    expect(result.answer.length).toBeGreaterThan(0);
    expect(result.citations.length).toBeGreaterThan(0);
    expect(result.citations[0].file_name).toBeDefined();
  });
});
