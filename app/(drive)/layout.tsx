"use client";

import React, { useState, useEffect } from "react";
import { DriveProvider, useDrive } from "@/components/drive/DriveContext";
import { Sidebar } from "@/components/drive/Sidebar";
import { Header } from "@/components/drive/Header";
import { Dialog } from "@/components/ui/Dialog";
import { FileUploadDropzone } from "@/components/drive/FileUploadDropzone";
import { CreateFolderModal } from "@/components/drive/FileActionsModal";
import { DocumentPreviewModal } from "@/components/drive/DocumentPreviewModal";
import { CompareModal } from "@/components/ai/CompareModal";
import { AiDrawer } from "@/components/ai/AiDrawer";

function DriveLayoutInner({ children }: { children: React.ReactNode }) {
  const {
    user,
    storageStats,
    isUploadOpen,
    setIsUploadOpen,
    isCreateFolderOpen,
    setIsCreateFolderOpen,
    isAiDrawerOpen,
    setIsAiDrawerOpen,
    isCompareOpen,
    setIsCompareOpen,
    previewFile,
    previewTargetPage,
    closePreview,
    openPreview,
    openCitation,
    openAiForFile,
    aiTargetFile,
    createFolder,
    refreshData,
    searchQuery,
    setSearchQuery,
    isSemanticSearch,
    setIsSemanticSearch,
    files,
    selectedFileIds,
    activeFolderId,
  } = useDrive();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    async function verifyAuth() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.status === 401) {
          window.location.href = "/login";
          return;
        }
      } catch {
        // In case of transient network error, allow rendering
      } finally {
        setCheckingAuth(false);
      }
    }
    verifyAuth();
  }, []);

  if (checkingAuth) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-muted-foreground font-medium">Loading workspace...</p>
        </div>
      </div>
    );
  }

  const selectedFiles = files.filter((f) => selectedFileIds.includes(f.id));

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar (Desktop persistent + Mobile drawer) */}
      <Sidebar
        storageStats={storageStats}
        onNewFolderClick={() => setIsCreateFolderOpen(true)}
        onUploadClick={() => setIsUploadOpen(true)}
        isOpenMobile={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        <Header
          user={user}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onOpenAiDrawer={() => openAiForFile(null)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          isSemanticSearch={isSemanticSearch}
          onToggleSemanticSearch={() => setIsSemanticSearch(!isSemanticSearch)}
        />

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>

      {/* Upload Modal */}
      <Dialog
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        title="Upload Documents & Files"
        description="Supported formats: PDF, DOCX, TXT, Markdown, and Images (max 15MB)."
        size="md"
      >
        <FileUploadDropzone
          currentFolderId={activeFolderId}
          onUploadComplete={refreshData}
          onClose={() => setIsUploadOpen(false)}
        />
      </Dialog>

      {/* Create Folder Modal */}
      <CreateFolderModal
        isOpen={isCreateFolderOpen}
        onClose={() => setIsCreateFolderOpen(false)}
        onCreate={createFolder}
      />

      {/* Document Preview Modal */}
      <DocumentPreviewModal
        file={previewFile}
        targetPage={previewTargetPage}
        isOpen={Boolean(previewFile)}
        onClose={closePreview}
        onAskAi={(f) => {
          closePreview();
          openAiForFile(f);
        }}
      />

      {/* Multi-Document Cross-Comparison Modal */}
      <CompareModal
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        selectedFiles={selectedFiles.length >= 2 ? selectedFiles : files.slice(0, 2)}
        onOpenCitation={openCitation}
      />

      {/* AI Assistant Drawer */}
      <AiDrawer
        isOpen={isAiDrawerOpen}
        onClose={() => {
          setIsAiDrawerOpen(false);
        }}
        activeFile={aiTargetFile}
        onOpenCitation={openCitation}
      />
    </div>
  );
}

export default function DriveLayout({ children }: { children: React.ReactNode }) {
  return (
    <DriveProvider>
      <DriveLayoutInner>{children}</DriveLayoutInner>
    </DriveProvider>
  );
}
