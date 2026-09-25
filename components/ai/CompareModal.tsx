"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileText,
  Bookmark,
  Layers,
  Loader2,
  HelpCircle,
  ArrowRight,
} from "lucide-react";
import { Dialog } from "../ui/Dialog";
import { Button } from "../ui/Button";
import { DriveFile, ComparisonResult, MessageCitation } from "@/types";

interface CompareModalProps {
  selectedFiles: DriveFile[];
  isOpen: boolean;
  onClose: () => void;
  onOpenCitation: (citation: MessageCitation) => void;
}

export function CompareModal({
  selectedFiles,
  isOpen,
  onClose,
  onOpenCitation,
}: CompareModalProps) {
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && selectedFiles.length >= 2) {
      runComparison();
    }
  }, [isOpen, selectedFiles]);

  const runComparison = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileIds: selectedFiles.map((f) => f.id) }),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Comparison failed");
      }

      const data = await res.json();
      setComparison(data.comparison);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error running AI comparison");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      className="max-h-[90vh] flex flex-col p-0 overflow-hidden"
    >
      {/* Header */}
      <div className="p-6 border-b border-border bg-card/80 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-foreground">Cross-File Document Comparison</h2>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                AI Synthesis
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Comparing {selectedFiles.map((f) => f.name).join(" vs ")}
            </p>
          </div>
        </div>
      </div>

      {/* Body Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-secondary/10">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm font-semibold text-foreground">Analyzing documents with Gemini 3.8 Flash...</p>
            <p className="text-xs text-muted-foreground max-w-sm">
              Extracting common themes, detecting skill gaps, and mapping supporting evidence across files.
            </p>
          </div>
        ) : error ? (
          <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm">
            <AlertCircle className="w-5 h-5 mb-2" />
            <p className="font-semibold">Comparison could not be completed</p>
            <p className="text-xs mt-1">{error}</p>
            <Button onClick={runComparison} variant="outline" size="sm" className="mt-4">
              Try Again
            </Button>
          </div>
        ) : comparison ? (
          <div className="space-y-6">
            {/* Executive Summary */}
            <div className="p-4 rounded-2xl bg-card border border-border shadow-sm space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                Executive Synthesis
              </h3>
              <p className="text-sm text-foreground leading-relaxed">{comparison.summary}</p>
            </div>

            {/* Grid of Common vs Missing Skills */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Common Skills Card */}
              <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 shadow-sm space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Common Skills & Overlap ({comparison.common_skills.length})
                </h4>
                <ul className="space-y-2">
                  {comparison.common_skills.map((skill, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-foreground">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      <span>{skill}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Missing Skills / Gaps Card */}
              <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 shadow-sm space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" />
                  Identified Gaps & Missing Skills ({comparison.missing_skills.length})
                </h4>
                <ul className="space-y-2">
                  {comparison.missing_skills.map((gap, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-foreground">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                      <span>{gap}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Supporting Evidence with Clickable Citations */}
            {comparison.supporting_evidence && comparison.supporting_evidence.length > 0 && (
              <div className="p-5 rounded-2xl bg-card border border-border shadow-sm space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <Bookmark className="w-4 h-4 text-primary" />
                  Document Evidence & Source Citations
                </h4>

                <div className="divide-y divide-border/60">
                  {comparison.supporting_evidence.map((item, idx) => (
                    <div key={idx} className="py-3 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground">{item.point}</span>
                        <button
                          onClick={() =>
                            onOpenCitation({
                              id: `comp-cit-${idx}`,
                              message_id: "",
                              file_id: "",
                              file_name: item.file_name,
                              page_number: item.page_number || 1,
                              snippet: item.quote,
                            })
                          }
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-mono text-[11px] font-semibold transition-colors"
                        >
                          <FileText className="w-3 h-3" />
                          <span>{item.file_name}</span>
                          <span>• P.{item.page_number || 1}</span>
                        </button>
                      </div>
                      <p className="text-muted-foreground italic font-serif bg-muted/40 p-2.5 rounded-xl border border-border/40">
                        "{item.quote}"
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border bg-card/80 flex justify-end shrink-0">
        <Button variant="outline" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>
    </Dialog>
  );
}
