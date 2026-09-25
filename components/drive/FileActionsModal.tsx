"use client";

import React, { useState, useEffect } from "react";
import { FolderPlus, Edit2, FolderInput, Folder } from "lucide-react";
import { Dialog } from "../ui/Dialog";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { DriveFile, FolderItem } from "@/types";

interface CreateFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, color?: string) => Promise<void>;
}

export function CreateFolderModal({ isOpen, onClose, onCreate }: CreateFolderModalProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("blue");
  const [loading, setLoading] = useState(false);

  const colors = [
    { id: "blue", label: "Blue", bg: "bg-blue-500" },
    { id: "emerald", label: "Emerald", bg: "bg-emerald-500" },
    { id: "purple", label: "Purple", bg: "bg-purple-500" },
    { id: "amber", label: "Amber", bg: "bg-amber-500" },
    { id: "rose", label: "Rose", bg: "bg-rose-500" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      await onCreate(name, color);
      setName("");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Folder"
      description="Organize your knowledge documents and files."
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-foreground">Folder Name</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Machine Learning Projects"
            autoFocus
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-foreground">Folder Color Tag</label>
          <div className="flex gap-2 pt-1">
            {colors.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setColor(c.id)}
                className={`w-6 h-6 rounded-full ${c.bg} transition-all ${
                  color === c.id ? "ring-2 ring-offset-2 ring-primary scale-110" : "opacity-70 hover:opacity-100"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="default" size="sm" isLoading={loading}>
            Create Folder
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

interface RenameModalProps {
  isOpen: boolean;
  initialName: string;
  onClose: () => void;
  onRename: (newName: string) => Promise<void>;
}

export function RenameModal({ isOpen, initialName, onClose, onRename }: RenameModalProps) {
  const [name, setName] = useState(initialName);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setName(initialName);
  }, [initialName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      await onRename(name);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Rename Item"
      description="Enter a new name for this file or folder."
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New name..."
          autoFocus
          required
        />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="default" size="sm" isLoading={loading}>
            Save Changes
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

interface MoveModalProps {
  isOpen: boolean;
  file: DriveFile | null;
  folders: FolderItem[];
  onClose: () => void;
  onMove: (fileId: string, targetFolderId: string | null) => Promise<void>;
}

export function MoveModal({ isOpen, file, folders, onClose, onMove }: MoveModalProps) {
  const [targetFolderId, setTargetFolderId] = useState<string | null>(file?.folder_id || null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setTargetFolderId(file?.folder_id || null);
  }, [file]);

  if (!file) return null;

  const handleMove = async () => {
    setLoading(true);
    try {
      await onMove(file.id, targetFolderId);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Move to Folder"
      description={`Select a destination for "${file.name}".`}
      size="sm"
    >
      <div className="space-y-3 pt-2">
        <div className="border border-border rounded-xl divide-y divide-border/60 max-h-60 overflow-y-auto">
          {/* Root option */}
          <button
            onClick={() => setTargetFolderId(null)}
            className={`w-full flex items-center gap-2.5 p-3 text-xs transition-colors text-left ${
              targetFolderId === null ? "bg-primary/10 text-primary font-semibold" : "hover:bg-muted"
            }`}
          >
            <Folder className="w-4 h-4 text-primary" />
            <span>My Drive (Root)</span>
          </button>

          {/* Folder items */}
          {folders.map((f) => (
            <button
              key={f.id}
              onClick={() => setTargetFolderId(f.id)}
              className={`w-full flex items-center gap-2.5 p-3 text-xs transition-colors text-left ${
                targetFolderId === f.id ? "bg-primary/10 text-primary font-semibold" : "hover:bg-muted"
              }`}
            >
              <Folder className="w-4 h-4 text-blue-500" />
              <span>{f.name}</span>
            </button>
          ))}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" variant="default" size="sm" isLoading={loading} onClick={handleMove}>
            Move Here
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
