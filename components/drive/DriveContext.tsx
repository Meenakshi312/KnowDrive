"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { DriveFile, FolderItem, StorageBreakdown, UserProfile, MessageCitation, FileType } from "@/types";
import { toast } from "sonner";
import { SortField, SortOrder } from "./FileToolbar";

interface DriveContextType {
  user: UserProfile | null;
  files: DriveFile[];
  folders: FolderItem[];
  storageStats: StorageBreakdown | null;
  loading: boolean;
  refreshData: () => Promise<void>;

  // Selection
  selectedFileIds: string[];
  toggleSelectFile: (fileId: string) => void;
  selectAll: () => void;
  clearSelection: () => void;

  // View & Filters
  viewMode: "grid" | "list";
  setViewMode: (mode: "grid" | "list") => void;
  sortField: SortField;
  sortOrder: SortOrder;
  setSort: (field: SortField, order: SortOrder) => void;
  filterType: FileType | "all";
  setFilterType: (type: FileType | "all") => void;

  // Search
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  isSemanticSearch: boolean;
  setIsSemanticSearch: (val: boolean) => void;

  // Modals & Panels
  isUploadOpen: boolean;
  setIsUploadOpen: (val: boolean) => void;
  isCreateFolderOpen: boolean;
  setIsCreateFolderOpen: (val: boolean) => void;
  isAiDrawerOpen: boolean;
  setIsAiDrawerOpen: (val: boolean) => void;
  isCompareOpen: boolean;
  setIsCompareOpen: (val: boolean) => void;

  // Active folder
  activeFolderId: string | null;
  setActiveFolderId: (id: string | null) => void;

  // Preview & Citations
  previewFile: DriveFile | null;
  previewTargetPage: number;
  openPreview: (file: DriveFile, page?: number) => void;
  closePreview: () => void;
  openCitation: (citation: MessageCitation) => void;

  // AI Active target
  aiTargetFile: DriveFile | null;
  openAiForFile: (file: DriveFile | null) => void;

  // Actions
  toggleStar: (fileId: string) => Promise<void>;
  moveToTrash: (fileId: string) => Promise<void>;
  restoreFromTrash: (fileId: string) => Promise<void>;
  permanentlyDelete: (fileId: string) => Promise<void>;
  createFolder: (name: string, color?: string) => Promise<void>;
  deleteFolder: (folderId: string) => Promise<void>;
  renameFile: (fileId: string, newName: string) => Promise<void>;
  moveFile: (fileId: string, folderId: string | null) => Promise<void>;
}

const DriveContext = createContext<DriveContextType | null>(null);

export function DriveProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [storageStats, setStorageStats] = useState<StorageBreakdown | null>(null);
  const [loading, setLoading] = useState(true);

  // Selection
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);

  // View state
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [filterType, setFilterType] = useState<FileType | "all">("all");

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [isSemanticSearch, setIsSemanticSearch] = useState(false);

  // Modals state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  // Active folder state
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);

  // Preview state
  const [previewFile, setPreviewFile] = useState<DriveFile | null>(null);
  const [previewTargetPage, setPreviewTargetPage] = useState<number>(1);
  const [aiTargetFile, setAiTargetFile] = useState<DriveFile | null>(null);

  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch files
      let filesUrl = "/api/files";
      if (searchQuery.trim()) {
        filesUrl = `/api/search?q=${encodeURIComponent(searchQuery)}&semantic=${isSemanticSearch}`;
      }

      const [filesRes, foldersRes] = await Promise.all([
        fetch(filesUrl),
        fetch("/api/folders"),
      ]);

      if (filesRes.status === 401) {
        window.location.href = "/login";
        return;
      }

      const filesData = await filesRes.json();
      const foldersData = await foldersRes.json();

      if (filesData.files) setFiles(filesData.files);
      if (filesData.storageStats) setStorageStats(filesData.storageStats);
      if (filesData.user) setUser(filesData.user);
      if (foldersData.folders) setFolders(foldersData.folders);
    } catch (err) {
      console.error("Failed to refresh data:", err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, isSemanticSearch]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Selection helpers
  const toggleSelectFile = (fileId: string) => {
    setSelectedFileIds((prev) =>
      prev.includes(fileId) ? prev.filter((id) => id !== fileId) : [...prev, fileId]
    );
  };

  const selectAll = () => {
    setSelectedFileIds(files.map((f) => f.id));
  };

  const clearSelection = () => {
    setSelectedFileIds([]);
  };

  const setSort = (field: SortField, order: SortOrder) => {
    setSortField(field);
    setSortOrder(order);
  };

  // Preview and Citations
  const openPreview = (file: DriveFile, page: number = 1) => {
    setPreviewFile(file);
    setPreviewTargetPage(page);
  };

  const closePreview = () => {
    setPreviewFile(null);
    setPreviewTargetPage(1);
  };

  const openCitation = (citation: MessageCitation) => {
    // Find matching file in local list
    const file = files.find(
      (f) =>
        f.id === citation.file_id ||
        f.name.toLowerCase() === citation.file_name.toLowerCase()
    );

    if (file) {
      openPreview(file, citation.page_number || 1);
    } else {
      toast.info(`Opening ${citation.file_name} at Page ${citation.page_number}`);
    }
  };

  const openAiForFile = (file: DriveFile | null) => {
    setAiTargetFile(file);
    setIsAiDrawerOpen(true);
  };

  // Actions
  const toggleStar = async (fileId: string) => {
    try {
      const res = await fetch(`/api/files/${fileId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle_star" }),
      });
      if (!res.ok) throw new Error("Failed to star file");
      await refreshData();
    } catch (e) {
      toast.error("Error updating star");
    }
  };

  const moveToTrash = async (fileId: string) => {
    try {
      const res = await fetch(`/api/files/${fileId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "trash" }),
      });
      if (!res.ok) throw new Error("Failed to move to trash");
      toast.success("File moved to Trash");
      await refreshData();
    } catch (e) {
      toast.error("Error trashing file");
    }
  };

  const restoreFromTrash = async (fileId: string) => {
    try {
      const res = await fetch(`/api/files/${fileId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restore" }),
      });
      if (!res.ok) throw new Error("Failed to restore file");
      toast.success("File restored to Drive");
      await refreshData();
    } catch (e) {
      toast.error("Error restoring file");
    }
  };

  const permanentlyDelete = async (fileId: string) => {
    try {
      const res = await fetch(`/api/files/${fileId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete file");
      toast.success("File permanently deleted");
      await refreshData();
    } catch (e) {
      toast.error("Error deleting file");
    }
  };

  const createFolder = async (name: string, color: string = "blue") => {
    try {
      const res = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, color }),
      });
      if (!res.ok) throw new Error("Failed to create folder");
      toast.success(`Folder "${name}" created`);
      await refreshData();
    } catch (e) {
      toast.error("Error creating folder");
    }
  };

  const deleteFolder = async (folderId: string) => {
    try {
      const res = await fetch(`/api/folders?id=${folderId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete folder");
      toast.success("Folder deleted");
      await refreshData();
    } catch (e) {
      toast.error("Error deleting folder");
    }
  };

  const renameFile = async (fileId: string, newName: string) => {
    try {
      const res = await fetch(`/api/files/${fileId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });
      if (!res.ok) throw new Error("Failed to rename file");
      toast.success("File renamed");
      await refreshData();
    } catch (e) {
      toast.error("Error renaming file");
    }
  };

  const moveFile = async (fileId: string, folderId: string | null) => {
    try {
      const res = await fetch(`/api/files/${fileId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder_id: folderId }),
      });
      if (!res.ok) throw new Error("Failed to move file");
      toast.success("File moved");
      await refreshData();
    } catch (e) {
      toast.error("Error moving file");
    }
  };

  return (
    <DriveContext.Provider
      value={{
        user,
        files,
        folders,
        storageStats,
        loading,
        refreshData,
        selectedFileIds,
        toggleSelectFile,
        selectAll,
        clearSelection,
        viewMode,
        setViewMode,
        sortField,
        sortOrder,
        setSort,
        filterType,
        setFilterType,
        searchQuery,
        setSearchQuery,
        isSemanticSearch,
        setIsSemanticSearch,
        isUploadOpen,
        setIsUploadOpen,
        isCreateFolderOpen,
        setIsCreateFolderOpen,
        isAiDrawerOpen,
        setIsAiDrawerOpen,
        isCompareOpen,
        setIsCompareOpen,
        activeFolderId,
        setActiveFolderId,
        previewFile,
        previewTargetPage,
        openPreview,
        closePreview,
        openCitation,
        aiTargetFile,
        openAiForFile,
        toggleStar,
        moveToTrash,
        restoreFromTrash,
        permanentlyDelete,
        createFolder,
        deleteFolder,
        renameFile,
        moveFile,
      }}
    >
      {children}
    </DriveContext.Provider>
  );
}

export function useDrive() {
  const context = useContext(DriveContext);
  if (!context) {
    throw new Error("useDrive must be used within a DriveProvider");
  }
  return context;
}
