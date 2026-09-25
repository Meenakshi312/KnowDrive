import pdfParse from "pdf-parse";
import mammoth from "mammoth";

export interface ExtractedDocument {
  title: string;
  pageCount: number;
  wordCount: number;
  fullText: string;
  pages: { pageNumber: number; text: string }[];
}

export async function extractDocumentText(
  buffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<ExtractedDocument> {
  const extension = fileName.split(".").pop()?.toLowerCase() || "";

  if (extension === "pdf" || mimeType === "application/pdf") {
    return extractPdf(buffer, fileName);
  }

  if (
    extension === "docx" ||
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return extractDocx(buffer, fileName);
  }

  if (["txt", "md", "markdown", "json", "csv"].includes(extension) || mimeType.startsWith("text/")) {
    return extractPlainText(buffer, fileName);
  }

  // Fallback generic handler
  const text = buffer.toString("utf-8").replace(/\0/g, "");
  return {
    title: fileName,
    pageCount: 1,
    wordCount: countWords(text),
    fullText: text,
    pages: [{ pageNumber: 1, text }],
  };
}

async function extractPdf(buffer: Buffer, fileName: string): Promise<ExtractedDocument> {
  try {
    const data = await pdfParse(buffer);
    const fullText = data.text || "";
    const pageCount = data.numpages || 1;

    // Split text into approximate pages based on form feeds (\f) or page count
    let pagesText = fullText.split("\f").filter((p: string) => p.trim().length > 0);
    if (pagesText.length === 0) {
      pagesText = [fullText];
    }

    const pages = pagesText.map((text: string, index: number) => ({
      pageNumber: index + 1,
      text: cleanText(text),
    }));

    return {
      title: fileName,
      pageCount: Math.max(pageCount, pages.length),
      wordCount: countWords(fullText),
      fullText: cleanText(fullText),
      pages,
    };
  } catch (error) {
    console.error("PDF parse error:", error);
    // Fallback if binary parser has an issue
    const text = buffer.toString("utf-8").replace(/[^a-zA-Z0-9\s.,!?:;'"()-]/g, " ");
    return {
      title: fileName,
      pageCount: 1,
      wordCount: countWords(text),
      fullText: text,
      pages: [{ pageNumber: 1, text }],
    };
  }
}

async function extractDocx(buffer: Buffer, fileName: string): Promise<ExtractedDocument> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    const fullText = cleanText(result.value || "");
    const estimatedPages = Math.max(1, Math.ceil(countWords(fullText) / 400));

    // Approximate page splitting by word chunks
    const words = fullText.split(/\s+/);
    const pages: { pageNumber: number; text: string }[] = [];
    for (let i = 0; i < estimatedPages; i++) {
      const pageSlice = words.slice(i * 400, (i + 1) * 400).join(" ");
      pages.push({ pageNumber: i + 1, text: pageSlice });
    }

    return {
      title: fileName,
      pageCount: estimatedPages,
      wordCount: countWords(fullText),
      fullText,
      pages,
    };
  } catch (error) {
    console.error("DOCX extraction error:", error);
    const text = buffer.toString("utf-8");
    return {
      title: fileName,
      pageCount: 1,
      wordCount: countWords(text),
      fullText: text,
      pages: [{ pageNumber: 1, text }],
    };
  }
}

function extractPlainText(buffer: Buffer, fileName: string): ExtractedDocument {
  const fullText = cleanText(buffer.toString("utf-8"));
  const estimatedPages = Math.max(1, Math.ceil(countWords(fullText) / 450));

  const words = fullText.split(/\s+/);
  const pages: { pageNumber: number; text: string }[] = [];
  for (let i = 0; i < estimatedPages; i++) {
    const slice = words.slice(i * 450, (i + 1) * 450).join(" ");
    pages.push({ pageNumber: i + 1, text: slice });
  }

  return {
    title: fileName,
    pageCount: estimatedPages,
    wordCount: countWords(fullText),
    fullText,
    pages,
  };
}

function cleanText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\t/g, " ")
    .replace(/[ \u00A0]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function countWords(str: string): number {
  return (str.match(/\b\S+\b/g) || []).length;
}
