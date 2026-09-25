"use client";

import React from "react";
import {
  LayoutGrid,
  List,
  ArrowUpDown,
  Filter,
  Sparkles,
  Trash2,
  X,
  FileCheck,
} from "lucide-react";
import { Button } from "../ui/Button";
import { FileType } from "@/types";

export type SortField = "name" | "date" | "size";
export type SortOrder = "asc" | "desc";

interface FileToolbarProps {
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
  sortField: SortField;
  sortOrder: SortOrder;
  onSortChange: (field: SortField, order: SortOrder) => void;
  filterType: FileType | "all";
  onFilterChange: (type: FileType | "all") => void;
  selectedCount: number;
  onCompareSelected: () => void;
  onDeleteSelected: () => void;
  onClearSelection: () => void;
}

export function FileToolbar({
  viewMode,
  onViewModeChange,
  sortField,
  sortOrder,
  onSortChange,
  filterType,
  onFilterChange,
  selectedCount,
  onCompareSelected,
  onDeleteSelected,
  onClearSelection,
}: FileToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 py-2 border-b border-border/60">
      {/* If files are selected: Show contextual batch action bar */}
      {selectedCount > 0 ? (
        <div className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/30 px-3 py-1.5 rounded-xl w-full sm:w-auto animate-in fade-in">
          <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
            <FileCheck className="w-4 h-4" />
            {selectedCount} {selectedCount === 1 ? "file" : "files"} selected
          </span>

          <div className="h-4 w-px bg-indigo-500/30 mx-1" />

          {selectedCount >= 2 && (
            <Button
              onClick={onCompareSelected}
              variant="brand"
              size="sm"
              className="h-7 text-xs font-semibold px-2.5 rounded-lg"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              Compare with AI
            </Button>
          )}

          <Button
            onClick={onDeleteSelected}
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 px-2 rounded-lg"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            Trash
          </Button>

          <button
            onClick={onClearSelection}
            className="p-1 text-muted-foreground hover:text-foreground rounded-md ml-auto"
            title="Clear selection"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        /* Filter tabs */
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {(["all", "pdf", "docx", "txt", "image"] as const).map((type) => {
            const labelMap: Record<string, string> = {
              all: "All Files",
              pdf: "PDFs",
              docx: "Word Docs",
              txt: "Text & MD",
              image: "Images",
            };
            const isActive = filterType === type;
            return (
              <button
                key={type}
                onClick={() => onFilterChange(type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 ${
                  isActive
                    ? "bg-secondary text-foreground font-semibold shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                {labelMap[type]}
              </button>
            );
          })}
        </div>
      )}

      {/* Right Tools: Sort dropdown and Grid/List toggle */}
      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
        {/* Sort selector */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/40 px-2.5 py-1.5 rounded-lg border border-border/50">
          <ArrowUpDown className="w-3.5 h-3.5" />
          <select
            value={`${sortField}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split("-") as [SortField, SortOrder];
              onSortChange(field, order);
            }}
            className="bg-transparent text-foreground font-medium focus:outline-none cursor-pointer"
          >
            <option className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100" value="date-desc">Newest First</option>
            <option className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100" value="date-asc">Oldest First</option>
            <option className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100" value="name-asc">Name (A to Z)</option>
            <option className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100" value="name-desc">Name (Z to A)</option>
            <option className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100" value="size-desc">Size (Largest)</option>
            <option className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100" value="size-asc">Size (Smallest)</option>
          </select>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-muted/40 p-0.5 rounded-lg border border-border/50">
          <button
            onClick={() => onViewModeChange("grid")}
            className={`p-1.5 rounded-md transition-colors ${
              viewMode === "grid"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title="Grid View"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => onViewModeChange("list")}
            className={`p-1.5 rounded-md transition-colors ${
              viewMode === "list"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title="List View"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
