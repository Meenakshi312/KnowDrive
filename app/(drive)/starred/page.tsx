"use client";

import React from "react";
import { useDrive } from "@/components/drive/DriveContext";
import { FileCard } from "@/components/drive/FileCard";
import { FileListRow } from "@/components/drive/FileListRow";
import { FileToolbar } from "@/components/drive/FileToolbar";
import { Star, Inbox } from "lucide-react";

export default function StarredFilesPage() {
  const {
    files,
    viewMode,
    setViewMode,
    sortField,
    sortOrder,
    setSort,
    filterType,
    setFilterType,
    selectedFileIds,
    toggleSelectFile,
    clearSelection,
    setIsCompareOpen,
    openPreview,
    openAiForFile,
    toggleStar,
    moveToTrash,
  } = useDrive();

  let starredFiles = files.filter((f) => f.is_starred && !f.is_trashed);

  if (filterType !== "all") {
    starredFiles = starredFiles.filter((f) => {
      if (filterType === "txt") return f.file_type === "txt" || f.file_type === "md";
      return f.file_type === filterType;
    });
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-2.5">
        <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
          <Star className="w-5 h-5 fill-amber-500/20" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Starred Documents</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Your bookmarked files for quick reference and priority AI queries
          </p>
        </div>
      </div>

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
        onDeleteSelected={() => {
          selectedFileIds.forEach((id) => moveToTrash(id));
          clearSelection();
        }}
        onClearSelection={clearSelection}
      />

      {starredFiles.length === 0 ? (
        <div className="py-20 rounded-2xl border border-dashed border-border flex flex-col items-center justify-center text-center p-6 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <Star className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">No starred files</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Star important documents to quickly find them here.
            </p>
          </div>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {starredFiles.map((file) => (
            <FileCard
              key={file.id}
              file={file}
              isSelected={selectedFileIds.includes(file.id)}
              onToggleSelect={toggleSelectFile}
              onPreview={openPreview}
              onAskAi={openAiForFile}
              onToggleStar={toggleStar}
              onTrash={moveToTrash}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border/80 bg-muted/30 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                <th className="py-3 px-3 w-10 text-center">Select</th>
                <th className="py-3 px-2 w-8 text-center">Star</th>
                <th className="py-3 px-3">Name</th>
                <th className="py-3 px-3 hidden sm:table-cell">AI Status</th>
                <th className="py-3 px-3 hidden md:table-cell">Size</th>
                <th className="py-3 px-3 hidden lg:table-cell">Pages</th>
                <th className="py-3 px-3 hidden sm:table-cell">Modified</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {starredFiles.map((file) => (
                <FileListRow
                  key={file.id}
                  file={file}
                  isSelected={selectedFileIds.includes(file.id)}
                  onToggleSelect={toggleSelectFile}
                  onPreview={openPreview}
                  onAskAi={openAiForFile}
                  onToggleStar={toggleStar}
                  onTrash={moveToTrash}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
