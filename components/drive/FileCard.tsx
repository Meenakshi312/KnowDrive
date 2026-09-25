"use client";

import React, { useState } from "react";
import {
  FileText,
  FileCode,
  Image as ImageIcon,
  File,
  Star,
  MoreVertical,
  Eye,
  Sparkles,
  Download,
  Trash2,
  Edit2,
  FolderInput,
  CheckCircle2,
  Loader2,
  AlertCircle,
  FileSearch,
} from "lucide-react";
import { DriveFile } from "@/types";
import { formatBytes, formatDate } from "@/lib/utils";

interface FileCardProps {
  file: DriveFile;
  isSelected: boolean;
  onToggleSelect: (fileId: string) => void;
  onPreview: (file: DriveFile) => void;
  onAskAi: (file: DriveFile) => void;
  onToggleStar: (fileId: string) => void;
  onTrash: (fileId: string) => void;
  onRename?: (file: DriveFile) => void;
  onMove?: (file: DriveFile) => void;
  onDownload?: (file: DriveFile) => void;
}

export function FileCard({
  file,
  isSelected,
  onToggleSelect,
  onPreview,
  onAskAi,
  onToggleStar,
  onTrash,
  onRename,
  onMove,
  onDownload,
}: FileCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  const getFileIcon = () => {
    switch (file.file_type) {
      case "pdf":
        return <FileText className="w-8 h-8 text-rose-500" />;
      case "docx":
        return <FileText className="w-8 h-8 text-blue-500" />;
      case "md":
      case "txt":
        return <FileCode className="w-8 h-8 text-emerald-500" />;
      case "image":
        return <ImageIcon className="w-8 h-8 text-amber-500" />;
      default:
        return <File className="w-8 h-8 text-slate-400" />;
    }
  };

  const getStatusBadge = () => {
    switch (file.processing_status) {
      case "ready":
        return (
          <span
            className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20"
            title="Indexed into pgvector. AI can reason about this document."
          >
            <CheckCircle2 className="w-3 h-3" />
            AI Ready
          </span>
        );
      case "processing":
        return (
          <span
            className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full animate-pulse"
            title="Extracting text chunks & vector embeddings..."
          >
            <Loader2 className="w-3 h-3 animate-spin" />
            Indexing...
          </span>
        );
      case "failed":
        return (
          <span
            className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full"
            title={file.error_message || "Document extraction failed"}
          >
            <AlertCircle className="w-3 h-3" />
            Failed
          </span>
        );
      default:
        return (
          <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            Pending
          </span>
        );
    }
  };

  return (
    <div
      className={`group relative rounded-2xl border bg-card p-4 transition-all duration-200 flex flex-col justify-between ${
        isSelected
          ? "border-primary ring-2 ring-primary/20 shadow-md bg-primary/5"
          : "border-border hover:border-primary/40 hover:shadow-lg"
      }`}
    >
      {/* Top Header: Checkbox + Star + Menu */}
      <div className="flex items-center justify-between gap-1 mb-3">
        {/* Selection Checkbox */}
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(file.id)}
          className="rounded border-border text-primary focus:ring-primary w-4 h-4 cursor-pointer"
          title="Select file for comparison or actions"
        />

        <div className="flex items-center gap-1">
          {/* Star Button */}
          <button
            onClick={() => onToggleStar(file.id)}
            className={`p-1 rounded-lg transition-colors ${
              file.is_starred
                ? "text-amber-400 hover:text-amber-500"
                : "text-muted-foreground/40 hover:text-amber-400 opacity-0 group-hover:opacity-100"
            }`}
            title={file.is_starred ? "Unstar" : "Star"}
          >
            <Star className={`w-4 h-4 ${file.is_starred ? "fill-amber-400" : ""}`} />
          </button>

          {/* Context Menu Button */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-full mt-1 z-40 bg-popover border border-border rounded-xl shadow-2xl p-1.5 w-48 text-xs animate-in fade-in zoom-in-95">
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onPreview(file);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-muted text-foreground text-left"
                  >
                    <Eye className="w-3.5 h-3.5 text-blue-500" />
                    <span>Preview Document</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onAskAi(file);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-medium text-left"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Ask AI About File</span>
                  </button>

                  {onDownload && (
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onDownload(file);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-muted text-foreground text-left"
                    >
                      <Download className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>Download</span>
                    </button>
                  )}

                  {onRename && (
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onRename(file);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-muted text-foreground text-left"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>Rename</span>
                    </button>
                  )}

                  {onMove && (
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onMove(file);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-muted text-foreground text-left"
                    >
                      <FolderInput className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>Move to Folder</span>
                    </button>
                  )}

                  <div className="h-px bg-border my-1" />

                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onTrash(file.id);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-rose-500/10 text-rose-500 text-left"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Move to Trash</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Clickable Area: Icon & Title */}
      <div
        onClick={() => onPreview(file)}
        className="cursor-pointer flex flex-col items-center py-4 text-center group-hover:scale-[1.02] transition-transform"
      >
        <div className="p-3 rounded-2xl bg-muted/50 mb-3 shadow-inner">
          {getFileIcon()}
        </div>
        <p
          className="text-xs font-semibold text-foreground truncate w-full px-1"
          title={file.name}
        >
          {file.name}
        </p>
      </div>

      {/* Footer Info: Status Badge, Pages, Size */}
      <div className="pt-3 border-t border-border/50 flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          {getStatusBadge()}
          <span className="text-[11px] text-muted-foreground">
            {formatBytes(file.size_bytes)}
          </span>
        </div>

        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span>{file.page_count ? `${file.page_count} pages` : formatDate(file.created_at)}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAskAi(file);
            }}
            className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-medium"
          >
            <Sparkles className="w-2.5 h-2.5" />
            Ask
          </button>
        </div>
      </div>
    </div>
  );
}
