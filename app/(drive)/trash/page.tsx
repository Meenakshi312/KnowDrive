"use client";

import React from "react";
import { useDrive } from "@/components/drive/DriveContext";
import { Trash2, RotateCcw, ShieldAlert, FileText, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatBytes, formatDate } from "@/lib/utils";

export default function TrashPage() {
  const { files, restoreFromTrash, permanentlyDelete } = useDrive();

  const trashedFiles = files.filter((f) => f.is_trashed);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">Trash Bin</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Items in trash are automatically excluded from AI knowledge searches and RAG retrieval
            </p>
          </div>
        </div>

        {trashedFiles.length > 0 && (
          <Button
            onClick={() => {
              if (confirm("Are you sure you want to permanently delete all items in Trash?")) {
                trashedFiles.forEach((f) => permanentlyDelete(f.id));
              }
            }}
            variant="destructive"
            size="sm"
            className="text-xs rounded-xl"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            Empty Trash
          </Button>
        )}
      </div>

      {trashedFiles.length === 0 ? (
        <div className="py-24 rounded-2xl border border-dashed border-border flex flex-col items-center justify-center text-center p-6 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground">
            <Trash2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Trash is empty</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Deleted documents will show up here before permanent removal.
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border/80 bg-muted/30 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Original Size</th>
                <th className="py-3 px-4">Deleted Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {trashedFiles.map((file) => (
                <tr key={file.id} className="hover:bg-muted/40 transition-colors">
                  <td className="py-3 px-4 font-semibold text-foreground flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span>{file.name}</span>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">
                    {formatBytes(file.size_bytes)}
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">
                    {formatDate(file.trashed_at || file.updated_at)}
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <Button
                      onClick={() => restoreFromTrash(file.id)}
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs rounded-lg"
                    >
                      <RotateCcw className="w-3.5 h-3.5 mr-1 text-primary" />
                      Restore
                    </Button>
                    <Button
                      onClick={() => permanentlyDelete(file.id)}
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 rounded-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" />
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
