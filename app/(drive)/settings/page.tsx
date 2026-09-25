"use client";

import React, { useState, useEffect } from "react";
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
  GraduationCap,
  Code2,
  Shield,
  HardDrive,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { toast } from "sonner";

export default function SettingsPage() {
  const { storageStats, user, setUser, refreshData, viewMode, setViewMode } = useDrive();
  const { theme, setTheme } = useTheme();
  const [syncing, setSyncing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [academicFocus, setAcademicFocus] = useState("Computer Science & Engineering");

  useEffect(() => {
    if (user?.full_name) {
      setFullName(user.full_name);
    }
  }, [user?.full_name]);

  useEffect(() => {
    const savedFocus = localStorage.getItem("knowdrive_academic_focus");
    if (savedFocus) setAcademicFocus(savedFocus);
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: fullName.trim() }),
      });

      if (!res.ok) {
        throw new Error("Failed to update profile");
      }

      const data = await res.json();
      if (data.user) {
        setUser(data.user);
      }
      localStorage.setItem("knowdrive_academic_focus", academicFocus);
      await refreshData();
      toast.success("Display name updated successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
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

  const displayName = fullName || user?.full_name || "Student User";
  const displayEmail = user?.email || "student@knowdrive.dev";

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
            {displayName[0]?.toUpperCase() || "S"}
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">{displayName}</h3>
            <p className="text-xs text-muted-foreground">{displayEmail}</p>
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
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Email Address</label>
            <Input
              value={displayEmail}
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
            <Button
              type="submit"
              variant="brand"
              size="sm"
              isLoading={saving}
              className="rounded-xl text-xs font-semibold"
            >
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

      {/* Account Info Details */}
      <div className="p-6 rounded-2xl bg-card border border-border shadow-sm space-y-4">
        <div className="flex items-center gap-2.5">
          <Shield className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-bold text-foreground">Security &amp; Storage Details</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          <div className="p-3.5 rounded-xl bg-muted/40 border border-border">
            <p className="text-[11px] text-muted-foreground">Storage Plan</p>
            <p className="text-sm font-bold text-foreground mt-0.5">1 GB Free Tier</p>
          </div>
          <div className="p-3.5 rounded-xl bg-muted/40 border border-border">
            <p className="text-[11px] text-muted-foreground">AI Embeddings</p>
            <p className="text-sm font-bold text-foreground mt-0.5">pgvector (768-dim)</p>
          </div>
          <div className="p-3.5 rounded-xl bg-muted/40 border border-border">
            <p className="text-[11px] text-muted-foreground">Account Status</p>
            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">Active</p>
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
