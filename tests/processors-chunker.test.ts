import { describe, it, expect } from "vitest";
import { extractDocumentText } from "@/lib/processors/text-extractor";
import { chunkDocument } from "@/lib/processors/chunker";

describe("Document Text Extraction & Intelligent Chunker", () => {
  it("extracts plain text and markdown documents with page estimation", async () => {
    const markdownContent = `# Distributed Systems Report\n\nThis is section one covering PostgreSQL partitioning.\n\n## Section Two\n\nDetails on pgvector indexing with HNSW cosine distance.`;
    const buffer = Buffer.from(markdownContent, "utf-8");

    const extracted = await extractDocumentText(buffer, "report.md", "text/markdown");
    expect(extracted.title).toBe("report.md");
    expect(extracted.fullText).toContain("PostgreSQL partitioning");
    expect(extracted.pages.length).toBeGreaterThanOrEqual(1);
    expect(extracted.wordCount).toBeGreaterThan(10);
  });

  it("chunks documents preserving page numbers and token boundaries", async () => {
    const multiPageDoc = {
      title: "Sample_Architecture.pdf",
      pageCount: 2,
      wordCount: 500,
      fullText: "Page 1 content about machine learning. Page 2 content about cloud storage platforms.",
      pages: [
        {
          pageNumber: 1,
          text: "Introduction to machine learning pipelines with high throughput and low latency inference. Model quantization INT8 was applied across transformer layers.",
        },
        {
          pageNumber: 2,
          text: "Database design utilizing PostgreSQL and pgvector for semantic knowledge retrieval. Row level security policies isolate tenant queries.",
        },
      ],
    };

    const chunks = chunkDocument(multiPageDoc, 50, 10);
    expect(chunks.length).toBeGreaterThanOrEqual(2);

    // Verify page numbers are preserved
    const page1Chunk = chunks.find((c) => c.page_number === 1);
    const page2Chunk = chunks.find((c) => c.page_number === 2);

    expect(page1Chunk).toBeDefined();
    expect(page2Chunk).toBeDefined();
    expect(page1Chunk?.chunk_text).toContain("machine learning");
    expect(page2Chunk?.chunk_text).toContain("PostgreSQL");
    expect(page1Chunk?.metadata.fileName).toBe("Sample_Architecture.pdf");
  });
});
