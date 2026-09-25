"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useDrive } from "@/components/drive/DriveContext";
import { Breadcrumbs } from "@/components/drive/Breadcrumbs";
import { FileToolbar } from "@/components/drive/FileToolbar";
import { FolderCard } from "@/components/drive/FolderCard";
import { FileCard } from "@/components/drive/FileCard";
import { FileListRow } from "@/components/drive/FileListRow";
import { RenameModal, MoveModal } from "@/components/drive/FileActionsModal";
import { DriveFile, FolderItem } from "@/types";
import { FolderPlus, UploadCloud, Sparkles, HardDrive, Inbox } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function DriveFolderPage() {
  const params = useParams();
  const folderIdParam = Array.isArray(params?.folderId)
    ? params.folderId[0]
    : (params?.folderId as string | undefined);

  const {
    files,
    folders,
    loading,
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
    deleteFolder,
    renameFile,
    moveFile,
    setIsUploadOpen,
    setIsCreateFolderOpen,
    setActiveFolderId,
  } = useDrive();

  // Rename and Move modal states
  const [renamingFile, setRenamingFile] = useState<DriveFile | null>(null);
  const [movingFile, setMovingFile] = useState<DriveFile | null>(null);

  // Current folder and folder contents
  const currentFolderId = folderIdParam || null;

  useEffect(() => {
    setActiveFolderId(currentFolderId);
    return () => setActiveFolderId(null);
  }, [currentFolderId, setActiveFolderId]);
  const currentFolder = folders.find((f) => f.id === currentFolderId) || null;

  // Filter folders inside current folder
  const currentFolders = folders.filter((f) =>
    currentFolderId ? f.parent_id === currentFolderId : !f.parent_id
  );

  // Filter files inside current folder
  let currentFiles = files.filter((f) => {
    if (f.is_trashed) return false;
    if (currentFolderId) return f.folder_id === currentFolderId;
    return !f.folder_id;
  });

  // Apply file type filter
  if (filterType !== "all") {
    currentFiles = currentFiles.filter((f) => {
      if (filterType === "txt") return f.file_type === "txt" || f.file_type === "md";
      return f.file_type === filterType;
    });
  }

  // Apply sorting
  currentFiles.sort((a, b) => {
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

  const handleDeleteSelected = () => {
    selectedFileIds.forEach((id) => moveToTrash(id));
    clearSelection();
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Top Navigation & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <Breadcrumbs currentFolder={currentFolder} />
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsCreateFolderOpen(true)}
            variant="outline"
            size="sm"
            className="text-xs rounded-xl"
          >
            <FolderPlus className="w-3.5 h-3.5 mr-1 text-blue-500" />
            New Folder
          </Button>
          <Button
            onClick={() => setIsUploadOpen(true)}
            variant="brand"
            size="sm"
            className="text-xs rounded-xl"
          >
            <UploadCloud className="w-3.5 h-3.5 mr-1" />
            Upload File
          </Button>
        </div>
      </div>

      {/* Toolbar Controls */}
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

      {/* Folders Section */}
      {currentFolders.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Folders ({currentFolders.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {currentFolders.map((folder) => (
              <FolderCard
                key={folder.id}
                folder={folder}
                onDelete={deleteFolder}
              />
            ))}
          </div>
        </div>
      )}

      {/* Files Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Files ({currentFiles.length})
          </h3>
          {currentFiles.length >= 2 && (
            <button
              onClick={() => setIsCompareOpen(true)}
              className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3" />
              Compare Documents with AI
            </button>
          )}
        </div>

        {currentFiles.length === 0 && currentFolders.length === 0 ? (
          <div className="py-20 rounded-2xl border border-dashed border-border flex flex-col items-center justify-center text-center p-6 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground">
              <Inbox className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">No files in this folder</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Drop your documents here or click upload to start building your knowledge base.
              </p>
            </div>
            <Button
              onClick={() => setIsUploadOpen(true)}
              variant="brand"
              size="sm"
              className="mt-2 rounded-xl text-xs"
            >
              <UploadCloud className="w-3.5 h-3.5 mr-1" />
              Upload Document
            </Button>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {currentFiles.map((file) => (
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
                  {currentFiles.map((file) => (
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

      {/* Rename File Modal */}
      {renamingFile && (
        <RenameModal
          isOpen={Boolean(renamingFile)}
          initialName={renamingFile.name}
          onClose={() => setRenamingFile(null)}
          onRename={(newName) => renameFile(renamingFile.id, newName)}
        />
      )}

      {/* Move File Modal */}
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
