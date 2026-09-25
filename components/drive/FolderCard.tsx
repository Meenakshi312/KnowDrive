"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Folder, MoreVertical, Trash2, Edit2, CornerUpRight } from "lucide-react";
import { FolderItem } from "@/types";

interface FolderCardProps {
  folder: FolderItem;
  onDelete: (folderId: string) => void;
  onRename?: (folder: FolderItem) => void;
}

export function FolderCard({ folder, onDelete, onRename }: FolderCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="relative group rounded-xl border border-border bg-card p-3.5 hover:border-primary/50 hover:shadow-md transition-all flex items-center justify-between">
      <Link
        href={`/drive/${folder.id}`}
        className="flex items-center gap-3 flex-1 min-w-0"
      >
        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
          <Folder className="w-5 h-5 fill-primary/20" />
        </div>
        <div className="truncate">
          <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
            {folder.name}
          </p>
          <p className="text-[11px] text-muted-foreground">Folder</p>
        </div>
      </Link>

      {/* Menu dropdown trigger */}
      <div className="relative shrink-0 ml-2">
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          className="p-1 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <MoreVertical className="w-4 h-4" />
        </button>

        {showMenu && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setShowMenu(false)} />
            <div className="absolute right-0 top-full mt-1 z-40 bg-popover border border-border rounded-xl shadow-xl p-1 w-36 text-xs animate-in fade-in">
              {onRename && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    onRename(folder);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-muted text-foreground text-left"
                >
                  <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Rename</span>
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                  onDelete(folder.id);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-rose-500/10 text-rose-500 text-left"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
