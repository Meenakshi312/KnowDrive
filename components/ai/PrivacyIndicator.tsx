import React from "react";
import { ShieldCheck, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface PrivacyIndicatorProps {
  className?: string;
  sourceCount?: number;
  compact?: boolean;
}

export function PrivacyIndicator({ className, sourceCount, compact = false }: PrivacyIndicatorProps) {
  if (compact) {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-full border border-border/50",
          className
        )}
      >
        <Lock className="w-3 h-3 text-emerald-500" />
        <span>Private & Grounded</span>
        {sourceCount !== undefined && (
          <span className="font-medium text-foreground">
            • {sourceCount} {sourceCount === 1 ? "source" : "sources"} used
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-start gap-2.5 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15 text-xs text-muted-foreground",
        className
      )}
    >
      <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
      <div>
        <p className="font-medium text-foreground text-emerald-950 dark:text-emerald-200">
          Your files are private and secure.
        </p>
        <p className="mt-0.5 text-muted-foreground">
          AI answers are generated strictly using documents you are authorized to access. Documents are never used to train external models.
        </p>
        {sourceCount !== undefined && (
          <p className="mt-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            Sources used: {sourceCount} {sourceCount === 1 ? "document" : "documents"}
          </p>
        )}
      </div>
    </div>
  );
}
