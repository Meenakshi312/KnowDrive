import { ExtractedDocument } from "./text-extractor";

export interface ChunkPayload {
  chunk_index: number;
  chunk_text: string;
  page_number: number;
  token_count: number;
  metadata: {
    fileName: string;
    charLength: number;
  };
}

export function chunkDocument(
  doc: ExtractedDocument,
  maxWordsPerChunk: number = 250,
  overlapWords: number = 35
): ChunkPayload[] {
  const result: ChunkPayload[] = [];
  let globalChunkIndex = 0;

  // Process page by page to guarantee strict page number citations
  for (const page of doc.pages) {
    const pageText = page.text.trim();
    if (!pageText) continue;

    // Split page into paragraphs
    const paragraphs = pageText.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
    let currentWords: string[] = [];

    for (const paragraph of paragraphs) {
      const paragraphWords = paragraph.split(/\s+/).filter(Boolean);

      if (currentWords.length + paragraphWords.length <= maxWordsPerChunk) {
        currentWords.push(...paragraphWords);
      } else {
        // If current buffer already has enough words, flush it as a chunk
        if (currentWords.length > 0) {
          const chunkText = currentWords.join(" ");
          result.push({
            chunk_index: globalChunkIndex++,
            chunk_text: chunkText,
            page_number: page.pageNumber,
            token_count: estimateTokens(chunkText),
            metadata: {
              fileName: doc.title,
              charLength: chunkText.length,
            },
          });

          // Carry over overlap
          currentWords = currentWords.slice(-overlapWords);
        }

        // If the single paragraph itself is larger than maxWordsPerChunk, slice it
        if (paragraphWords.length > maxWordsPerChunk) {
          for (let i = 0; i < paragraphWords.length; i += maxWordsPerChunk - overlapWords) {
            const slice = paragraphWords.slice(i, i + maxWordsPerChunk);
            if (slice.length < 15 && result.length > 0) break; // skip tiny trailing snippets
            const text = slice.join(" ");
            result.push({
              chunk_index: globalChunkIndex++,
              chunk_text: text,
              page_number: page.pageNumber,
              token_count: estimateTokens(text),
              metadata: {
                fileName: doc.title,
                charLength: text.length,
              },
            });
          }
          currentWords = [];
        } else {
          currentWords.push(...paragraphWords);
        }
      }
    }

    // Flush any remaining words for this page
    if (currentWords.length > 10) {
      const text = currentWords.join(" ");
      result.push({
        chunk_index: globalChunkIndex++,
        chunk_text: text,
        page_number: page.pageNumber,
        token_count: estimateTokens(text),
        metadata: {
          fileName: doc.title,
          charLength: text.length,
        },
      });
    }
  }

  // Fallback if no page produced chunks
  if (result.length === 0 && doc.fullText.trim().length > 0) {
    const text = doc.fullText.slice(0, 1500);
    result.push({
      chunk_index: 0,
      chunk_text: text,
      page_number: 1,
      token_count: estimateTokens(text),
      metadata: {
        fileName: doc.title,
        charLength: text.length,
      },
    });
  }

  return result;
}

function estimateTokens(text: string): number {
  // Common heuristic: 1 token ~= 4 characters or ~0.75 words in English
  return Math.ceil(text.length / 4);
}
