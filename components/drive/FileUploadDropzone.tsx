"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2, X } from "lucide-react";
import { Button } from "../ui/Button";
import { formatBytes } from "@/lib/utils";
import { toast } from "sonner";

interface UploadingFile {
  id: string;
  name: string;
  size: number;
  progress: number;
  status: "uploading" | "processing" | "completed" | "error";
  error?: string;
}

interface FileUploadDropzoneProps {
  currentFolderId?: string | null;
  onUploadComplete: () => void;
  onClose: () => void;
}

export function FileUploadDropzone({
  currentFolderId,
  onUploadComplete,
  onClose,
}: FileUploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploads, setUploads] = useState<UploadingFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processAndUploadFile = async (file: File) => {
    // Client-side validations
    const maxSizeBytes = 15 * 1024 * 1024; // 15MB free-tier friendly limit
    if (file.size > maxSizeBytes) {
      toast.error(`"${file.name}" exceeds the 15MB limit.`);
      return;
    }

    const uploadId = Math.random().toString(36).substring(2, 9);
    const item: UploadingFile = {
      id: uploadId,
      name: file.name,
      size: file.size,
      progress: 20,
      status: "uploading",
    };

    setUploads((prev) => [item, ...prev]);

    try {
      const formData = new FormData();
      formData.append("file", file);
      if (currentFolderId) {
        formData.append("folder_id", currentFolderId);
      }

      // Simulate network progression
      setUploads((prev) =>
        prev.map((u) => (u.id === uploadId ? { ...u, progress: 60 } : u))
      );

      const res = await fetch("/api/files/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Upload failed");
      }

      const resData = await res.json();

      setUploads((prev) =>
        prev.map((u) =>
          u.id === uploadId ? { ...u, progress: 90, status: "processing" } : u
        )
      );

      // Trigger server-side document text extraction & embedding in background
      if (resData.file?.id) {
        fetch("/api/process", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileId: resData.file.id }),
        }).catch((e) => console.error("Async doc process trigger err:", e));
      }

      // Complete
      setUploads((prev) =>
        prev.map((u) =>
          u.id === uploadId ? { ...u, progress: 100, status: "completed" } : u
        )
      );

      toast.success(`"${file.name}" uploaded! Processing knowledge index in background.`);
      onUploadComplete();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Upload error";
      setUploads((prev) =>
        prev.map((u) =>
          u.id === uploadId ? { ...u, status: "error", error: errorMsg } : u
        )
      );
      toast.error(`Failed to upload "${file.name}": ${errorMsg}`);
    }
  };

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    Array.from(fileList).forEach(processAndUploadFile);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone Box */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
          isDragging
            ? "border-primary bg-primary/10 scale-[1.01]"
            : "border-border/80 hover:border-primary/50 hover:bg-muted/40"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.txt,.md,image/*"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
          <UploadCloud className="w-8 h-8" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">
            Drop your documents here, or <span className="text-primary hover:underline">browse files</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Supports PDF, DOCX, Markdown, TXT, and Images (up to 15MB each)
          </p>
        </div>
      </div>

      {/* Uploads Queue List */}
      {uploads.length > 0 && (
        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Upload Activity
          </p>
          {uploads.map((file) => (
            <div
              key={file.id}
              className="p-3 rounded-xl border border-border bg-card/60 flex flex-col gap-1.5 text-xs"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 truncate">
                  <FileText className="w-4 h-4 text-primary shrink-0" />
                  <span className="font-medium text-foreground truncate max-w-[200px]">
                    {file.name}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    ({formatBytes(file.size)})
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {file.status === "uploading" && (
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin text-primary" />
                      Uploading...
                    </span>
                  )}
                  {file.status === "processing" && (
                    <span className="text-[11px] text-primary flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Indexing chunks...
                    </span>
                  )}
                  {file.status === "completed" && (
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Ready
                    </span>
                  )}
                  {file.status === "error" && (
                    <span className="text-[11px] text-rose-500 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {file.error || "Failed"}
                    </span>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    file.status === "error"
                      ? "bg-rose-500"
                      : file.status === "completed"
                      ? "bg-emerald-500"
                      : "bg-primary"
                  }`}
                  style={{ width: `${file.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2 border-t border-border/60">
        <Button variant="outline" size="sm" onClick={onClose}>
          Done
        </Button>
      </div>
    </div>
  );
}
