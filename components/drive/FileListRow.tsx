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
  Clock,
} from "lucide-react";
import { DriveFile } from "@/types";
import { formatBytes, formatDate } from "@/lib/utils";

interface FileListRowProps {
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

export function FileListRow({
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
}: FileListRowProps) {
  const [showMenu, setShowMenu] = useState(false);

  const getFileIcon = () => {
    switch (file.file_type) {
      case "pdf":
        return <FileText className="w-4 h-4 text-rose-500 shrink-0" />;
      case "docx":
        return <FileText className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />;
      case "md":
      case "txt":
        return <FileCode className="w-4 h-4 text-emerald-500 shrink-0" />;
      case "image":
        return <ImageIcon className="w-4 h-4 text-amber-500 shrink-0" />;
      default:
        return <File className="w-4 h-4 text-slate-400 shrink-0" />;
    }
  };

  return (
    <tr
      className={`group border-b border-border/50 hover:bg-muted/40 transition-colors text-xs ${
        isSelected ? "bg-primary/5" : ""
      }`}
    >
      {/* Checkbox column */}
      <td className="py-3 px-3 w-10 text-center">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(file.id)}
          className="rounded border-border text-primary focus:ring-primary w-4 h-4 cursor-pointer"
        />
      </td>

      {/* Star column */}
      <td className="py-3 px-2 w-8 text-center">
        <button
          onClick={() => onToggleStar(file.id)}
          className={`p-1 rounded-lg transition-colors ${
            file.is_starred
              ? "text-amber-400 hover:text-amber-500"
              : "text-muted-foreground/30 hover:text-amber-400 opacity-0 group-hover:opacity-100"
          }`}
        >
          <Star className={`w-3.5 h-3.5 ${file.is_starred ? "fill-amber-400" : ""}`} />
        </button>
      </td>

      {/* Name and icon column */}
      <td className="py-3 px-3">
        <div
          onClick={() => onPreview(file)}
          className="flex items-center gap-2.5 cursor-pointer group-hover:text-primary transition-colors max-w-md truncate"
        >
          {getFileIcon()}
          <span className="font-semibold text-foreground truncate">{file.name}</span>
        </div>
      </td>

      {/* AI Processing Status */}
      <td className="py-3 px-3 hidden sm:table-cell">
        {file.processing_status === "ready" ? (
          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            <CheckCircle2 className="w-3 h-3" />
            AI Ready
          </span>
        ) : file.processing_status === "processing" ? (
          <span className="inline-flex items-center gap-1 text-[11px] text-primary font-medium animate-pulse">
            <Loader2 className="w-3 h-3 animate-spin" />
            Indexing
          </span>
        ) : file.processing_status === "pending" ? (
          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground font-medium">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        ) : (
          <span
            className="inline-flex items-center gap-1 text-[11px] text-rose-500 font-medium"
            title={file.error_message || "Document processing failed"}
          >
            <AlertCircle className="w-3 h-3" />
            Failed
          </span>
        )}
      </td>

      {/* Size */}
      <td className="py-3 px-3 text-muted-foreground hidden md:table-cell">
        {formatBytes(file.size_bytes)}
      </td>

      {/* Pages/Words */}
      <td className="py-3 px-3 text-muted-foreground hidden lg:table-cell">
        {file.page_count ? `${file.page_count} pgs` : "—"}
      </td>

      {/* Date */}
      <td className="py-3 px-3 text-muted-foreground hidden sm:table-cell">
        {formatDate(file.created_at)}
      </td>

      {/* Fast AI Ask Button & Menu */}
      <td className="py-3 px-3 text-right">
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => onAskAi(file)}
            className="p-1.5 text-xs text-primary hover:bg-primary/10 rounded-lg flex items-center gap-1 font-medium transition-colors"
            title="Ask AI about this file"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Ask AI</span>
          </button>

          {/* Context menu */}
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
                <div className="absolute right-0 top-full mt-1 z-40 bg-popover border border-border rounded-xl shadow-2xl p-1.5 w-44 text-xs animate-in fade-in">
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onPreview(file);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-muted text-foreground text-left"
                  >
                    <Eye className="w-3.5 h-3.5 text-primary" />
                    <span>Preview</span>
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
                      <span>Move</span>
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
                    <span>Trash</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </td>
    </tr>
  );
}
