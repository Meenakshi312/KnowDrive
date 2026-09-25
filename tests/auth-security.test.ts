import { describe, it, expect } from "vitest";
import { KnowDriveRepository } from "@/lib/db/repository";
import { retrieveRagContext } from "@/lib/ai/rag";
import { searchChunksBySimilarity, EMBEDDING_DIMENSION } from "@/lib/ai/embeddings";

describe("Tenant Security & Isolation (User A vs User B)", () => {
  const userA_Id = "00000000-0000-0000-0000-000000000001";
  const userB_Id = "00000000-0000-0000-0000-000000000002";

  const repoUserA = new KnowDriveRepository(userA_Id);
  const repoUserB = new KnowDriveRepository(userB_Id);

  it("User B cannot access or list User A files", async () => {
    const filesA = await repoUserA.getFiles({ isTrashed: false });
    expect(filesA.length).toBeGreaterThan(0);

    const filesB = await repoUserB.getFiles({ isTrashed: false });
    // User B repository must return 0 files because User B owns no files
    expect(filesB.length).toBe(0);

    // Explicit access check for User A file by ID
    const fileA = filesA[0];
    const attemptAccessByB = await repoUserB.getFileById(fileA.id);
    expect(attemptAccessByB).toBeNull();
  });

  it("User B cannot access User A document chunks", async () => {
    const filesA = await repoUserA.getFiles({ isTrashed: false });
    const fileA = filesA[0];

    const chunksUserA = await repoUserA.getChunksByFile(fileA.id);
    expect(chunksUserA.length).toBeGreaterThan(0);

    const chunksAttemptUserB = await repoUserB.getChunksByFile(fileA.id);
    expect(chunksAttemptUserB.length).toBe(0);
  });

  it("User B cannot search User A files via metadata or keyword search", async () => {
    const filesA = await repoUserA.getFiles({ searchQuery: "Resume", isTrashed: false });
    expect(filesA.length).toBeGreaterThan(0);

    const filesB = await repoUserB.getFiles({ searchQuery: "Resume", isTrashed: false });
    expect(filesB.length).toBe(0);
  });

  it("User B cannot retrieve User A chunks through vector similarity search", () => {
    // 768-dimensional normalized test query vector
    const queryVec = new Array(EMBEDDING_DIMENSION).fill(1 / Math.sqrt(EMBEDDING_DIMENSION));

    const chunksUserB = repoUserB.getAllChunks();
    const results = searchChunksBySimilarity(chunksUserB, queryVec, 5, 0.2);

    expect(results.length).toBe(0);
  });

  it("Throws a clear error if Gemini API is not configured during RAG retrieval", async () => {
    const query = "What did I do in my OpenFOAM project?";
    // When GEMINI_API_KEY is not configured, generateEmbedding must reject
    if (!process.env.GEMINI_API_KEY) {
      await expect(
        retrieveRagContext(repoUserB, userB_Id, query)
      ).rejects.toThrow("Gemini API is not configured");
    }
  });
});
