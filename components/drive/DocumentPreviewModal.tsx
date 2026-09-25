"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  FileCode,
  Download,
  Sparkles,
  ExternalLink,
  BookOpen,
  Layers,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { Dialog } from "../ui/Dialog";
import { Button } from "../ui/Button";
import { DriveFile, DocumentChunk, DocumentRecord } from "@/types";
import { formatBytes, formatDate } from "@/lib/utils";

interface DocumentPreviewModalProps {
  file: DriveFile | null;
  targetPage?: number;
  isOpen: boolean;
  onClose: () => void;
  onAskAi: (file: DriveFile) => void;
}

export function DocumentPreviewModal({
  file,
  targetPage = 1,
  isOpen,
  onClose,
  onAskAi,
}: DocumentPreviewModalProps) {
  const [activeTab, setActiveTab] = useState<"preview" | "chunks" | "info">("preview");
  const [currentPage, setCurrentPage] = useState<number>(targetPage);
  const [chunks, setChunks] = useState<DocumentChunk[]>([]);
  const [documentMeta, setDocumentMeta] = useState<DocumentRecord | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (targetPage) setCurrentPage(targetPage);
  }, [targetPage]);

  useEffect(() => {
    if (!file || !isOpen) return;

    setLoading(true);
    // Fetch document metadata and chunks for this file
    fetch(`/api/files/${file.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.chunks) setChunks(data.chunks);
        if (data.document) setDocumentMeta(data.document);
      })
      .catch((err) => console.error("Error loading file details:", err))
      .finally(() => setLoading(false));
  }, [file, isOpen]);

  if (!file) return null;

  // Filter chunks for current page if available, else show all
  const pageChunks = chunks.filter((c) => c.page_number === currentPage);
  const displayChunks = pageChunks.length > 0 ? pageChunks : chunks;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      size="full"
      className="h-[88vh] max-w-5xl flex flex-col p-0 overflow-hidden"
    >
      {/* Header bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/80 shrink-0">
        <div className="flex items-center gap-3 truncate">
          <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div className="truncate">
            <h2 className="text-base font-bold text-foreground truncate">{file.name}</h2>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
              <span>{formatBytes(file.size_bytes)}</span>
              <span>•</span>
              <span>{file.page_count ? `${file.page_count} Pages` : formatDate(file.created_at)}</span>
              <span>•</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Indexed in pgvector
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            onClick={() => {
              onClose();
              onAskAi(file);
            }}
            variant="brand"
            size="sm"
            className="text-xs font-semibold rounded-xl"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            Ask AI
          </Button>

          {file.download_url && (
            <a
              href={file.download_url}
              download={file.name}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center h-8 px-3 text-xs font-medium rounded-lg border border-border hover:bg-muted text-foreground transition-colors"
            >
              <Download className="w-3.5 h-3.5 mr-1" />
              Download
            </a>
          )}
        </div>
      </div>

      {/* Tabs bar */}
      <div className="flex items-center justify-between px-6 border-b border-border bg-muted/30 shrink-0 text-xs font-medium">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab("preview")}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === "preview"
                ? "border-primary text-primary font-semibold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Document View
          </button>
          <button
            onClick={() => setActiveTab("chunks")}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === "chunks"
                ? "border-primary text-primary font-semibold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Layers className="w-4 h-4" />
            RAG Knowledge Chunks ({chunks.length})
          </button>
          <button
            onClick={() => setActiveTab("info")}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === "info"
                ? "border-primary text-primary font-semibold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            File Security & Metadata
          </button>
        </div>

        {/* Page navigation controls */}
        {file.page_count && file.page_count > 1 && (
          <div className="flex items-center gap-2 py-1.5">
            <span className="text-muted-foreground">
              Page {currentPage} of {file.page_count}
            </span>
            <div className="flex items-center gap-0.5">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1 rounded hover:bg-muted disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={currentPage >= (file.page_count || 1)}
                onClick={() => setCurrentPage((p) => Math.min(file.page_count || 1, p + 1))}
                className="p-1 rounded hover:bg-muted disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto p-6 bg-secondary/20">
        {activeTab === "preview" && (
          <div className="max-w-3xl mx-auto bg-card rounded-2xl border border-border p-8 shadow-sm space-y-6 min-h-[500px]">
            {targetPage && targetPage > 1 && (
              <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-600 dark:text-indigo-400 flex items-center justify-between">
                <span>
                  Jumped directly to <strong>Page {targetPage}</strong> from AI citation.
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider">Citation Jump</span>
              </div>
            )}

            <div className="border-b border-border/60 pb-4">
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                {documentMeta?.title || file.name}
              </h1>
              <p className="text-xs text-muted-foreground mt-1">
                Viewing content for Page {currentPage}
              </p>
            </div>

            {/* Render chunks corresponding to this page */}
            {displayChunks.length > 0 ? (
              <div className="space-y-4 font-serif text-sm leading-relaxed text-foreground/90">
                {displayChunks.map((chunk) => (
                  <div
                    key={chunk.id}
                    className="p-4 rounded-xl bg-muted/30 border border-border/40 hover:border-primary/30 transition-all"
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground mb-2">
                      <span>Page {chunk.page_number} • Chunk #{chunk.chunk_index + 1}</span>
                      <span>{chunk.token_count} tokens</span>
                    </div>
                    <p className="whitespace-pre-wrap">{chunk.chunk_text}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-muted-foreground text-sm">
                Document text extraction completed. No text for this specific page.
              </div>
            )}
          </div>
        )}

        {activeTab === "chunks" && (
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="p-4 rounded-xl bg-card border border-border text-xs text-muted-foreground">
              These chunks are stored in PostgreSQL with 768-dimensional vector embeddings and retrieved using cosine similarity for RAG questions.
            </div>

            <div className="grid gap-3">
              {chunks.map((chunk) => (
                <div
                  key={chunk.id}
                  className="p-4 rounded-xl bg-card border border-border shadow-sm space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between text-muted-foreground font-mono text-[11px]">
                    <span className="font-semibold text-primary">
                      Chunk #{chunk.chunk_index + 1} • Page {chunk.page_number}
                    </span>
                    <span>Tokens: ~{chunk.token_count}</span>
                  </div>
                  <p className="text-foreground/90 font-serif leading-relaxed">
                    {chunk.chunk_text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "info" && (
          <div className="max-w-2xl mx-auto bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4 text-xs">
            <h3 className="text-sm font-semibold text-foreground">File Security & Storage Details</h3>
            <div className="divide-y divide-border/60">
              <div className="py-2.5 flex justify-between">
                <span className="text-muted-foreground">Storage Engine</span>
                <span className="font-medium text-foreground">Supabase Private Storage Bucket</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-muted-foreground">Row Level Security</span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">Enforced (Owner Only)</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-muted-foreground">File Path</span>
                <span className="font-mono text-foreground">{file.storage_path}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-muted-foreground">MIME Type</span>
                <span className="font-mono text-foreground">{file.mime_type}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-muted-foreground">Uploaded At</span>
                <span className="text-foreground">{formatDate(file.created_at)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
}
