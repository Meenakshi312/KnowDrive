"use client";

import React, { useState } from "react";
import { useDrive } from "@/components/drive/DriveContext";
import { StorageMeter } from "@/components/drive/StorageMeter";
import { useTheme } from "next-themes";
import {
  User,
  Sun,
  Moon,
  Laptop,
  LayoutGrid,
  List,
  RefreshCw,
  LogOut,
  FolderSync,
  GraduationCap,
  Code2,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { toast } from "sonner";

export default function SettingsPage() {
  const { storageStats, user, refreshData, viewMode, setViewMode } = useDrive();
  const { theme, setTheme } = useTheme();
  const [syncing, setSyncing] = useState(false);
  const [fullName, setFullName] = useState(user?.full_name || "Student User");
  const [academicFocus, setAcademicFocus] = useState("Computer Science & Engineering");

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Profile preferences saved locally!");
  };

  const handleSyncWorkspace = async () => {
    setSyncing(true);
    try {
      await refreshData();
      toast.success("Workspace synced with database!");
    } finally {
      setSyncing(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      toast.success("Signed out successfully");
      window.location.href = "/login";
    } catch {
      window.location.href = "/login";
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
          <User className="w-6 h-6 text-primary" />
          Account &amp; Drive Preferences
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Manage your student profile, workspace display, and storage usage.
        </p>
      </div>

      {/* Student Profile Card */}
      <div className="p-6 rounded-2xl bg-card border border-border shadow-sm space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xl border border-primary/20">
            {fullName ? fullName[0].toUpperCase() : "S"}
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">{fullName}</h3>
            <p className="text-xs text-muted-foreground">{user?.email || "student@knowdrive.dev"}</p>
            <div className="inline-flex items-center gap-1.5 mt-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold">
              <GraduationCap className="w-3 h-3" />
              <span>Student Account</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-border">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Display Name</label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your Name"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Email Address</label>
            <Input
              value={user?.email || "student@knowdrive.dev"}
              disabled
              className="bg-muted text-muted-foreground cursor-not-allowed"
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-medium text-foreground">Major / Academic Focus</label>
            <Input
              value={academicFocus}
              onChange={(e) => setAcademicFocus(e.target.value)}
              placeholder="e.g. Computer Science, Mechanical Engineering, Data Science"
            />
          </div>

          <div className="md:col-span-2 flex justify-end pt-2">
            <Button type="submit" variant="brand" size="sm" className="rounded-xl text-xs font-semibold">
              Save Changes
            </Button>
          </div>
        </form>
      </div>

      {/* Workspace & Display Preferences */}
      <div className="p-6 rounded-2xl bg-card border border-border shadow-sm space-y-6">
        <h3 className="text-sm font-bold text-foreground">Workspace Preferences</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Theme Selector */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-foreground block">Interface Theme</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTheme("light")}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-xs font-medium transition-all ${
                  theme === "light"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border hover:bg-muted text-muted-foreground"
                }`}
              >
                <Sun className="w-4 h-4" />
                <span>Light</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-xs font-medium transition-all ${
                  theme === "dark"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border hover:bg-muted text-muted-foreground"
                }`}
              >
                <Moon className="w-4 h-4" />
                <span>Dark</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme("system")}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-xs font-medium transition-all ${
                  theme === "system"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border hover:bg-muted text-muted-foreground"
                }`}
              >
                <Laptop className="w-4 h-4" />
                <span>System</span>
              </button>
            </div>
          </div>

          {/* Default Drive View Mode */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-foreground block">Default File View</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-medium transition-all ${
                  viewMode === "grid"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border hover:bg-muted text-muted-foreground"
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
                <span>Grid View</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-medium transition-all ${
                  viewMode === "list"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border hover:bg-muted text-muted-foreground"
                }`}
              >
                <List className="w-4 h-4" />
                <span>List View</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Storage Meter */}
      <StorageMeter stats={storageStats} />

      {/* About KnowDrive / Student Project Info */}
      <div className="p-6 rounded-2xl bg-card border border-border shadow-sm space-y-4">
        <div className="flex items-center gap-2.5">
          <Code2 className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-bold text-foreground">About KnowDrive</h3>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          KnowDrive is a full-stack student portfolio application designed to combine personal cloud document management with an AI knowledge assistant. Documents are securely stored, chunked, and embedded into a PostgreSQL vector database with page-aware RAG citations.
        </p>

        <div className="pt-2">
          <p className="text-[11px] font-semibold text-foreground uppercase tracking-wider mb-2">
            Built With
          </p>
          <div className="flex flex-wrap gap-2 text-xs">
            {["Next.js 15", "React 19", "TypeScript", "Tailwind CSS", "Supabase PostgreSQL", "pgvector (768-dim)", "Google Gemini AI", "pdf-parse / mammoth"].map((tech) => (
              <span
                key={tech}
                className="px-2.5 py-1 rounded-lg bg-muted text-muted-foreground border border-border/80 text-[11px] font-medium"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Session Management */}
      <div className="p-6 rounded-2xl bg-card border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-xs font-bold text-foreground">Session &amp; Workspace Sync</h4>
          <p className="text-[11px] text-muted-foreground">
            Synchronize client data with the database or end your current session.
          </p>
        </div>
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <Button
            onClick={handleSyncWorkspace}
            variant="outline"
            size="sm"
            isLoading={syncing}
            className="text-xs rounded-xl flex-1 sm:flex-none"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Sync Workspace
          </Button>
          <Button
            onClick={handleLogout}
            variant="outline"
            size="sm"
            className="text-xs rounded-xl text-destructive hover:bg-destructive/10 border-destructive/30 flex-1 sm:flex-none"
          >
            <LogOut className="w-3.5 h-3.5 mr-1.5" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}
