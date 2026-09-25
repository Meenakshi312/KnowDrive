"use client";

import React from "react";
import { useDrive } from "@/components/drive/DriveContext";
import { StorageMeter } from "@/components/drive/StorageMeter";
import {
  FileText,
  HardDrive,
  Sparkles,
  Layers,
  Folder,
  Star,
  UploadCloud,
  FolderPlus,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function DashboardPage() {
  const {
    files,
    folders,
    storageStats,
    openAiForFile,
    setIsUploadOpen,
    setIsCreateFolderOpen,
    setIsCompareOpen,
  } = useDrive();

  const activeFiles = files.filter((f) => !f.is_trashed);
  const starredFiles = activeFiles.filter((f) => f.is_starred);

  const storageUsedMb = ((storageStats?.total_bytes || 0) / (1024 * 1024)).toFixed(1);
  const storageQuotaGb = (
    (storageStats?.quota_bytes || 1073741824) /
    (1024 * 1024 * 1024)
  ).toFixed(0);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Welcome Banner */}
      <div className="relative rounded-3xl bg-card border border-border p-6 md:p-8 overflow-hidden shadow-sm">
        <div className="relative z-10 max-w-2xl space-y-3">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            KnowDrive: Your Files, Understood.
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
            Store course documents and technical reports, organize them into folders, and query across multiple files with clickable page citations.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              onClick={() => setIsUploadOpen(true)}
              variant="brand"
              size="sm"
              className="rounded-xl text-xs font-semibold shadow-sm"
            >
              <UploadCloud className="w-3.5 h-3.5 mr-1.5" />
              Upload Document
            </Button>
            <Button
              onClick={() => setIsCreateFolderOpen(true)}
              variant="outline"
              size="sm"
              className="rounded-xl text-xs font-semibold"
            >
              <FolderPlus className="w-3.5 h-3.5 mr-1.5" />
              New Folder
            </Button>
            <Button
              onClick={() => openAiForFile(null)}
              variant="secondary"
              size="sm"
              className="rounded-xl text-xs font-semibold"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5 text-primary" />
              Ask Assistant
            </Button>
            <Button
              onClick={() => setIsCompareOpen(true)}
              variant="ghost"
              size="sm"
              className="rounded-xl text-xs font-semibold"
            >
              <Layers className="w-3.5 h-3.5 mr-1.5" />
              Compare Files
            </Button>
          </div>
        </div>
      </div>

      {/* Cloud Drive Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Documents */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold tracking-tight text-foreground">{activeFiles.length}</p>
            <p className="text-xs text-muted-foreground font-medium">Total Documents</p>
          </div>
        </div>

        {/* Storage Used */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <HardDrive className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold tracking-tight text-foreground">{storageUsedMb} MB</p>
            <p className="text-xs text-muted-foreground font-medium">Used of {storageQuotaGb} GB Free Tier</p>
          </div>
        </div>

        {/* Folders Organized */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Folder className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold tracking-tight text-foreground">{folders.length}</p>
            <p className="text-xs text-muted-foreground font-medium">Folders Organized</p>
          </div>
        </div>

        {/* Starred Documents */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <Star className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold tracking-tight text-foreground">{starredFiles.length}</p>
            <p className="text-xs text-muted-foreground font-medium">Starred Documents</p>
          </div>
        </div>
      </div>

      {/* Storage Breakdown Meter */}
      <StorageMeter stats={storageStats} />
    </div>
  );
}
