import { getGeminiClient, isGeminiConfigured } from "./client";
import { DocumentChunk } from "@/types";

export const EMBEDDING_DIMENSION = 768;
export const EMBEDDING_MODEL = "gemini-embedding-001";

export type EmbeddingTaskType = "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY" | "SEMANTIC_SIMILARITY";

const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "are",
  "but",
  "not",
  "you",
  "all",
  "can",
  "her",
  "was",
  "one",
  "our",
  "out",
  "has",
  "have",
  "this",
  "that",
  "with",
  "from",
  "what",
  "when",
  "where",
  "which",
  "your",
  "about",
  "into",
  "than",
  "then",
  "them",
  "they",
  "their",
  "did",
  "does",
  "how",
  "who",
  "why",
  "any",
  "had",
  "his",
  "its",
  "let",
  "may",
  "too",
  "via",
  "my",
  "in",
  "of",
  "to",
  "on",
  "is",
  "it",
  "or",
  "as",
  "be",
  "at",
  "by",
  "an",
  "a",
]);

/**
 * Generate a 768-dimensional embedding vector using Google Gemini gemini-embedding-001.
 * Explicitly requests outputDimensionality: 768.
 * Throws a clear error if Gemini API is not configured or the API call fails.
 */
export async function generateEmbedding(
  text: string,
  taskType: EmbeddingTaskType = "RETRIEVAL_DOCUMENT"
): Promise<number[]> {
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
        taskType,
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

export async function tryGenerateQueryEmbedding(text: string): Promise<number[] | null> {
  if (!isGeminiConfigured) return null;
  try {
    return await generateEmbedding(text, "RETRIEVAL_QUERY");
  } catch (err) {
    console.warn("Query embedding generation failed, falling back to lexical retrieval:", err);
    return null;
  }
}

/**
 * Parse pgvector / JSON embeddings returned by Supabase into a number[].
 */
export function parseEmbedding(raw: unknown): number[] | undefined {
  if (!raw) return undefined;

  let values: number[] | null = null;
  if (Array.isArray(raw)) {
    values = raw.map(Number);
  } else if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) values = parsed.map(Number);
    } catch {
      return undefined;
    }
  }

  if (!values || values.length !== EMBEDDING_DIMENSION || values.some((n) => Number.isNaN(n))) {
    return undefined;
  }
  return values;
}

/**
 * Format a vector for PostgreSQL pgvector inserts via PostgREST.
 */
export function formatEmbeddingForPg(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
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

export function tokenizeQuery(query: string): string[] {
  return query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
}

/**
 * Keyword overlap score in [0, 1] with a phrase bonus.
 */
export function lexicalSimilarity(query: string, text: string): number {
  const tokens = tokenizeQuery(query);
  if (tokens.length === 0 || !text) return 0;

  const haystack = text.toLowerCase();
  let hits = 0;
  for (const token of tokens) {
    if (haystack.includes(token)) hits += 1;
  }

  const coverage = hits / tokens.length;
  const compactQuery = tokens.join(" ");
  const phraseBonus = compactQuery.length > 6 && haystack.includes(compactQuery) ? 0.15 : 0;
  return Math.min(1, coverage + phraseBonus);
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

/**
 * Hybrid retrieval: cosine similarity when embeddings exist, lexical overlap otherwise.
 * Always returns grounded document chunks when text is available.
 */
export function hybridSearchChunks(
  chunks: DocumentChunk[],
  query: string,
  queryEmbedding: number[] | null,
  topK: number = 8,
  minThreshold: number = 0.12
): (DocumentChunk & { similarity: number })[] {
  const scored = chunks
    .map((chunk) => {
      const lexical = lexicalSimilarity(query, `${chunk.file_name || ""} ${chunk.chunk_text}`);
      let vector = 0;
      if (
        queryEmbedding &&
        queryEmbedding.length === EMBEDDING_DIMENSION &&
        Array.isArray(chunk.embedding) &&
        chunk.embedding.length === EMBEDDING_DIMENSION
      ) {
        try {
          vector = cosineSimilarity(queryEmbedding, chunk.embedding);
        } catch {
          vector = 0;
        }
      }

      const similarity =
        vector > 0 && lexical > 0
          ? Math.min(1, vector * 0.7 + lexical * 0.3)
          : Math.max(vector, lexical);

      return { ...chunk, similarity };
    })
    .filter((c) => c.similarity >= minThreshold)
    .sort((a, b) => b.similarity - a.similarity);

  if (scored.length > 0) {
    return scored.slice(0, topK);
  }

  // Last resort: return the first chunks so a targeted file can still be summarized
  return chunks.slice(0, Math.min(topK, chunks.length)).map((chunk, index) => ({
    ...chunk,
    similarity: Math.max(0.1, 0.35 - index * 0.02),
  }));
}

function normalizeVector(vec: number[]): number[] {
  const norm = Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0));
  if (norm === 0) return vec;
  return vec.map((val) => val / norm);
}
