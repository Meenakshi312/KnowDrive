import { getGeminiClient, isGeminiConfigured } from "./client";
import { DocumentChunk } from "@/types";

export const EMBEDDING_DIMENSION = 768;
export const EMBEDDING_MODEL = "gemini-embedding-001";

/**
 * Generate a 768-dimensional embedding vector using Google Gemini gemini-embedding-001.
 * Explicitly requests outputDimensionality: 768.
 * Throws a clear error if Gemini API is not configured or the API call fails.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!isGeminiConfigured) {
    throw new Error(
      "Gemini API is not configured. Please provide a valid GEMINI_API_KEY in your environment variables to generate embeddings."
    );
  }

  const ai = getGeminiClient();
  if (!ai) {
    throw new Error(
      "Failed to initialize Gemini AI client. Ensure GEMINI_API_KEY is properly set."
    );
  }

  try {
    const response = await ai.models.embedContent({
      model: EMBEDDING_MODEL,
      contents: text.slice(0, 8000),
      config: {
        outputDimensionality: EMBEDDING_DIMENSION,
      },
    });

    const res = response as {
      embeddings?: Array<{ values?: number[] }>;
      embedding?: { values?: number[] };
    };

    const values =
      res.embeddings?.[0]?.values ||
      res.embedding?.values ||
      null;

    if (!values || values.length === 0) {
      throw new Error("Gemini API returned an empty embedding vector.");
    }

    if (values.length !== EMBEDDING_DIMENSION) {
      // Ensure exactly 768 dimensions for PostgreSQL vector(768)
      if (values.length > EMBEDDING_DIMENSION) {
        return normalizeVector(values.slice(0, EMBEDDING_DIMENSION));
      }
      throw new Error(
        `Gemini embedding dimension mismatch: expected ${EMBEDDING_DIMENSION}, received ${values.length}.`
      );
    }

    return normalizeVector(values);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    throw new Error(
      `Gemini embedding generation failed with model '${EMBEDDING_MODEL}': ${errorMessage}`
    );
  }
}

/**
 * Compute cosine similarity between two normalized vectors: (A . B) / (||A|| * ||B||)
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length === 0 || b.length === 0 || a.length !== b.length) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Vector similarity search across document chunks.
 * Only compares chunks with valid embeddings; skips chunks without embeddings.
 */
export function searchChunksBySimilarity(
  chunks: DocumentChunk[],
  queryEmbedding: number[],
  topK: number = 8,
  minThreshold: number = 0.35
): (DocumentChunk & { similarity: number })[] {
  if (!queryEmbedding || queryEmbedding.length !== EMBEDDING_DIMENSION) {
    throw new Error(
      `Query embedding must be exactly ${EMBEDDING_DIMENSION} dimensions for vector similarity search.`
    );
  }

  const scored = chunks
    .filter(
      (chunk): chunk is DocumentChunk & { embedding: number[] } =>
        Array.isArray(chunk.embedding) && chunk.embedding.length === EMBEDDING_DIMENSION
    )
    .map((chunk) => {
      const similarity = cosineSimilarity(queryEmbedding, chunk.embedding);
      return {
        ...chunk,
        similarity,
      };
    })
    .filter((c) => c.similarity >= minThreshold)
    .sort((a, b) => b.similarity - a.similarity);

  return scored.slice(0, topK);
}

function normalizeVector(vec: number[]): number[] {
  const norm = Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0));
  if (norm === 0) return vec;
  return vec.map((val) => val / norm);
}
