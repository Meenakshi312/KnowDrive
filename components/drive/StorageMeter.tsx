"use client";

import React from "react";
import { formatBytes } from "@/lib/utils";
import { StorageBreakdown } from "@/types";
import { HardDrive, FileText, Image as ImageIcon, FileCode, Archive } from "lucide-react";

interface StorageMeterProps {
  stats: StorageBreakdown | null;
  compact?: boolean;
}

export function StorageMeter({ stats, compact = false }: StorageMeterProps) {
  if (!stats) return null;

  const percentage = Math.min(100, Math.round((stats.total_bytes / stats.quota_bytes) * 100));

  if (compact) {
    return (
      <div className="px-3 py-3 rounded-xl bg-muted/40 border border-border/60">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="flex items-center gap-1.5 font-medium text-foreground">
            <HardDrive className="w-3.5 h-3.5 text-muted-foreground" />
            Storage
          </span>
          <span className="text-muted-foreground">
            {formatBytes(stats.total_bytes)} of {formatBytes(stats.quota_bytes)}
          </span>
        </div>
        <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-primary h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.max(percentage, 2)}%` }}
          />
        </div>
        <div className="mt-1 text-[11px] text-muted-foreground">
          {percentage}% used • Free Student Tier
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-2xl bg-card border border-border shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-primary" />
            Storage Usage
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Cloud PostgreSQL metadata & private Supabase object storage
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary">
          Free Tier
        </span>
      </div>

      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-2xl font-bold tracking-tight text-foreground">
          {formatBytes(stats.total_bytes)}
        </span>
        <span className="text-sm text-muted-foreground">
          used of {formatBytes(stats.quota_bytes)}
        </span>
      </div>

      {/* Progress Bar with multi-segment colors */}
      <div className="w-full bg-secondary h-3 rounded-full overflow-hidden flex my-3">
        <div
          className="bg-rose-500 h-full transition-all"
          style={{ width: `${(stats.by_type.pdf.bytes / stats.quota_bytes) * 100}%` }}
          title={`PDFs: ${formatBytes(stats.by_type.pdf.bytes)}`}
        />
        <div
          className="bg-teal-500 h-full transition-all"
          style={{ width: `${(stats.by_type.docx.bytes / stats.quota_bytes) * 100}%` }}
          title={`Word Docs: ${formatBytes(stats.by_type.docx.bytes)}`}
        />
        <div
          className="bg-emerald-500 h-full transition-all"
          style={{ width: `${(stats.by_type.txt_md.bytes / stats.quota_bytes) * 100}%` }}
          title={`Markdown / Text: ${formatBytes(stats.by_type.txt_md.bytes)}`}
        />
        <div
          className="bg-amber-500 h-full transition-all"
          style={{ width: `${(stats.by_type.image.bytes / stats.quota_bytes) * 100}%` }}
          title={`Images: ${formatBytes(stats.by_type.image.bytes)}`}
        />
        <div
          className="bg-purple-500 h-full transition-all"
          style={{ width: `${(stats.by_type.other.bytes / stats.quota_bytes) * 100}%` }}
          title={`Other: ${formatBytes(stats.by_type.other.bytes)}`}
        />
      </div>

      {/* Breakdown Legend */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-3 border-t border-border/60">
        <div className="flex items-center gap-2 text-xs">
          <div className="w-3 h-3 rounded-full bg-rose-500 shrink-0" />
          <div className="truncate">
            <div className="font-medium text-foreground">PDF Documents</div>
            <div className="text-muted-foreground">{formatBytes(stats.by_type.pdf.bytes)} ({stats.by_type.pdf.count})</div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <div className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
          <div className="truncate">
            <div className="font-medium text-foreground">Markdown & TXT</div>
            <div className="text-muted-foreground">{formatBytes(stats.by_type.txt_md.bytes)} ({stats.by_type.txt_md.count})</div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <div className="w-3 h-3 rounded-full bg-amber-500 shrink-0" />
          <div className="truncate">
            <div className="font-medium text-foreground">Images</div>
            <div className="text-muted-foreground">{formatBytes(stats.by_type.image.bytes)} ({stats.by_type.image.count})</div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <div className="w-3 h-3 rounded-full bg-teal-500 shrink-0" />
          <div className="truncate">
            <div className="font-medium text-foreground">DOCX & Other</div>
            <div className="text-muted-foreground">{formatBytes(stats.by_type.docx.bytes + stats.by_type.other.bytes)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
