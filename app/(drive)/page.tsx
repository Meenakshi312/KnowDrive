"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useDrive } from "@/components/drive/DriveContext";
import { StorageMeter } from "@/components/drive/StorageMeter";
import { FileCard } from "@/components/drive/FileCard";
import { FileListRow } from "@/components/drive/FileListRow";
import { FolderCard } from "@/components/drive/FolderCard";
import { FileToolbar } from "@/components/drive/FileToolbar";
import { RenameModal, MoveModal } from "@/components/drive/FileActionsModal";
import { DriveFile } from "@/types";
import {
  FileText,
  HardDrive,
  Sparkles,
  Layers,
  ArrowRight,
  Clock,
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
    openPreview,
    openAiForFile,
    toggleStar,
    moveToTrash,
    selectedFileIds,
    toggleSelectFile,
    clearSelection,
    renameFile,
    moveFile,
    deleteFolder,
    viewMode,
    setViewMode,
    sortField,
    sortOrder,
    setSort,
    filterType,
    setFilterType,
    setIsUploadOpen,
    setIsCreateFolderOpen,
    setIsAiDrawerOpen,
    setIsCompareOpen,
  } = useDrive();

  // Modals for rename/move
  const [renamingFile, setRenamingFile] = useState<DriveFile | null>(null);
  const [movingFile, setMovingFile] = useState<DriveFile | null>(null);

  const activeFiles = files.filter((f) => !f.is_trashed);
  const starredFiles = activeFiles.filter((f) => f.is_starred);

  // Filter files by type
  let filteredFiles = activeFiles;
  if (filterType !== "all") {
    filteredFiles = filteredFiles.filter((f) => {
      if (filterType === "txt") return f.file_type === "txt" || f.file_type === "md";
      return f.file_type === filterType;
    });
  }

  // Sort files according to sortField and sortOrder
  const sortedFiles = [...filteredFiles].sort((a, b) => {
    if (sortField === "name") {
      return sortOrder === "asc"
        ? a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" })
        : b.name.localeCompare(a.name, undefined, { numeric: true, sensitivity: "base" });
    }
    if (sortField === "size") {
      const sizeA = Number(a.size_bytes) || 0;
      const sizeB = Number(b.size_bytes) || 0;
      return sortOrder === "asc" ? sizeA - sizeB : sizeB - sizeA;
    }
    // Default date
    const dateA = new Date(a.created_at).getTime() || 0;
    const dateB = new Date(b.created_at).getTime() || 0;
    return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
  });

  const storageUsedMb = ((storageStats?.total_bytes || 0) / (1024 * 1024)).toFixed(1);
  const storageQuotaGb = (
    (storageStats?.quota_bytes || 1073741824) /
    (1024 * 1024 * 1024)
  ).toFixed(0);

  const handleDeleteSelected = () => {
    selectedFileIds.forEach((id) => moveToTrash(id));
    clearSelection();
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Student Project Welcome Banner */}
      <div className="relative rounded-3xl bg-card border border-border p-6 md:p-8 overflow-hidden shadow-sm">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20">
            <Sparkles className="w-3.5 h-3.5" />
            Student Portfolio Project &bull; Full-Stack Knowledge Drive
          </div>
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
              <Sparkles className="w-3.5 h-3.5 mr-1.5 text-blue-600 dark:text-blue-400" />
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
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
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

      {/* Folders Overview */}
      {folders.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Folder className="w-4 h-4 text-primary" />
              Folders
            </h2>
            <Link
              href="/drive"
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {folders.slice(0, 4).map((f) => (
              <FolderCard
                key={f.id}
                folder={f}
                onDelete={deleteFolder}
              />
            ))}
          </div>
        </div>
      )}

      {/* Suggested Assistant Prompts */}
      <div className="p-6 rounded-2xl bg-muted/40 border border-border space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Ask Assistant Across Your Files</h3>
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Gemini Assistant
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Click a prompt below or click &ldquo;Ask AI&rdquo; on any document card to query it directly:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
          <button
            onClick={() => openAiForFile(null)}
            className="p-3 rounded-xl bg-card hover:bg-muted/80 border border-border text-left text-xs font-medium text-foreground hover:border-primary/40 transition-all shadow-sm"
          >
            &ldquo;Who is the applicant and what are the details in my application form?&rdquo;
          </button>
          <button
            onClick={() => openAiForFile(null)}
            className="p-3 rounded-xl bg-card hover:bg-muted/80 border border-border text-left text-xs font-medium text-foreground hover:border-primary/40 transition-all shadow-sm"
          >
            &ldquo;Summarize the education, skills, and qualifications in my documents.&rdquo;
          </button>
          <button
            onClick={() => openAiForFile(null)}
            className="p-3 rounded-xl bg-card hover:bg-muted/80 border border-border text-left text-xs font-medium text-foreground hover:border-primary/40 transition-all shadow-sm"
          >
            &ldquo;Compare the documents in my Drive and list their key findings.&rdquo;
          </button>
        </div>
      </div>

      {/* Storage Breakdown Meter */}
      <StorageMeter stats={storageStats} />

      {/* Documents Section with Interactive FileToolbar */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              Documents & Files
            </h2>
            <p className="text-xs text-muted-foreground">
              Showing {sortedFiles.length} of {activeFiles.length} documents &bull; Sort by Largest, Smallest, or A-Z
            </p>
          </div>
          <Link
            href="/drive"
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
          >
            <span>Open in Full Drive</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Toolbar with live Size, A-Z, Date sorting and Grid/List toggle */}
        <FileToolbar
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          sortField={sortField}
          sortOrder={sortOrder}
          onSortChange={setSort}
          filterType={filterType}
          onFilterChange={setFilterType}
          selectedCount={selectedFileIds.length}
          onCompareSelected={() => setIsCompareOpen(true)}
          onDeleteSelected={handleDeleteSelected}
          onClearSelection={clearSelection}
        />

        {sortedFiles.length === 0 ? (
          <div className="p-8 rounded-2xl bg-card border border-dashed border-border text-center space-y-3">
            <FileText className="w-8 h-8 text-muted-foreground mx-auto" />
            <p className="text-sm font-medium text-foreground">No documents found matching filters</p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {filterType !== "all"
                ? `You have no ${filterType.toUpperCase()} files. Try selecting "All Files" above.`
                : "Upload your PDF, DOCX, TXT, or Markdown documents to begin organizing and querying them with AI."}
            </p>
            <Button
              onClick={() => setIsUploadOpen(true)}
              variant="outline"
              size="sm"
              className="rounded-xl text-xs"
            >
              Upload Document
            </Button>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {sortedFiles.map((file) => (
              <FileCard
                key={file.id}
                file={file}
                isSelected={selectedFileIds.includes(file.id)}
                onToggleSelect={toggleSelectFile}
                onPreview={openPreview}
                onAskAi={openAiForFile}
                onToggleStar={toggleStar}
                onTrash={moveToTrash}
                onRename={setRenamingFile}
                onMove={setMovingFile}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border/80 bg-muted/30 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    <th className="py-3 px-3 w-10 text-center">Select</th>
                    <th className="py-3 px-2 w-8 text-center">Star</th>
                    <th
                      className="py-3 px-3 cursor-pointer hover:text-foreground select-none"
                      onClick={() => setSort("name", sortField === "name" && sortOrder === "asc" ? "desc" : "asc")}
                      title="Sort by Name"
                    >
                      <div className="flex items-center gap-1">
                        <span>Name</span>
                        {sortField === "name" && (
                          <span className="text-primary font-bold">{sortOrder === "asc" ? "↑" : "↓"}</span>
                        )}
                      </div>
                    </th>
                    <th className="py-3 px-3 hidden sm:table-cell">AI Status</th>
                    <th
                      className="py-3 px-3 hidden md:table-cell cursor-pointer hover:text-foreground select-none"
                      onClick={() => setSort("size", sortField === "size" && sortOrder === "desc" ? "asc" : "desc")}
                      title="Sort by Size"
                    >
                      <div className="flex items-center gap-1">
                        <span>Size</span>
                        {sortField === "size" && (
                          <span className="text-primary font-bold">{sortOrder === "desc" ? "↓" : "↑"}</span>
                        )}
                      </div>
                    </th>
                    <th className="py-3 px-3 hidden lg:table-cell">Pages</th>
                    <th
                      className="py-3 px-3 hidden sm:table-cell cursor-pointer hover:text-foreground select-none"
                      onClick={() => setSort("date", sortField === "date" && sortOrder === "desc" ? "asc" : "desc")}
                      title="Sort by Date"
                    >
                      <div className="flex items-center gap-1">
                        <span>Modified</span>
                        {sortField === "date" && (
                          <span className="text-primary font-bold">{sortOrder === "desc" ? "↓" : "↑"}</span>
                        )}
                      </div>
                    </th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {sortedFiles.map((file) => (
                    <FileListRow
                      key={file.id}
                      file={file}
                      isSelected={selectedFileIds.includes(file.id)}
                      onToggleSelect={toggleSelectFile}
                      onPreview={openPreview}
                      onAskAi={openAiForFile}
                      onToggleStar={toggleStar}
                      onTrash={moveToTrash}
                      onRename={setRenamingFile}
                      onMove={setMovingFile}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Rename Modal */}
      {renamingFile && (
        <RenameModal
          isOpen={Boolean(renamingFile)}
          onClose={() => setRenamingFile(null)}
          initialName={renamingFile.name}
          onRename={async (newName) => {
            await renameFile(renamingFile.id, newName);
            setRenamingFile(null);
          }}
        />
      )}

      {/* Move to Folder Modal */}
      {movingFile && (
        <MoveModal
          isOpen={Boolean(movingFile)}
          file={movingFile}
          folders={folders}
          onClose={() => setMovingFile(null)}
          onMove={moveFile}
        />
      )}
    </div>
  );
}
