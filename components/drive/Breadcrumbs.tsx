import React from "react";
import Link from "next/link";
import { ChevronRight, HardDrive, Folder } from "lucide-react";
import { FolderItem } from "@/types";

interface BreadcrumbsProps {
  currentFolder?: FolderItem | null;
  parentFolders?: FolderItem[];
  baseTitle?: string;
  baseHref?: string;
}

export function Breadcrumbs({
  currentFolder,
  parentFolders = [],
  baseTitle = "My Drive",
  baseHref = "/drive",
}: BreadcrumbsProps) {
  return (
    <nav className="flex items-center text-sm text-muted-foreground overflow-x-auto py-1">
      <Link
        href={baseHref}
        className="flex items-center gap-1.5 hover:text-foreground font-medium transition-colors shrink-0"
      >
        <HardDrive className="w-4 h-4 text-primary" />
        <span>{baseTitle}</span>
      </Link>

      {parentFolders.map((folder) => (
        <React.Fragment key={folder.id}>
          <ChevronRight className="w-3.5 h-3.5 mx-1.5 text-muted-foreground/60 shrink-0" />
          <Link
            href={`/drive/${folder.id}`}
            className="hover:text-foreground transition-colors truncate max-w-[150px]"
          >
            {folder.name}
          </Link>
        </React.Fragment>
      ))}

      {currentFolder && (
        <>
          <ChevronRight className="w-3.5 h-3.5 mx-1.5 text-muted-foreground/60 shrink-0" />
          <div className="flex items-center gap-1.5 text-foreground font-semibold truncate max-w-[200px]">
            <Folder className="w-4 h-4 text-blue-500 fill-blue-500/20" />
            <span className="truncate">{currentFolder.name}</span>
          </div>
        </>
      )}
    </nav>
  );
}
