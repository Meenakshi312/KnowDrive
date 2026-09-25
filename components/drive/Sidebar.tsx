"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HardDrive,
  LayoutDashboard,
  Clock,
  Star,
  Trash2,
  Sparkles,
  Settings,
  Plus,
  FolderPlus,
  UploadCloud,
  Layers,
  Brain,
  X,
  FileSearch,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StorageMeter } from "./StorageMeter";
import { StorageBreakdown } from "@/types";
import { Button } from "../ui/Button";

interface SidebarProps {
  storageStats: StorageBreakdown | null;
  onNewFolderClick: () => void;
  onUploadClick: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({
  storageStats,
  onNewFolderClick,
  onUploadClick,
  isOpenMobile,
  onCloseMobile,
}: SidebarProps) {
  const pathname = usePathname();
  const [showNewMenu, setShowNewMenu] = React.useState(false);

  const navLinks = [
    { label: "Dashboard", href: "/", icon: LayoutDashboard },
    { label: "My Drive", href: "/drive", icon: HardDrive },
    { label: "Recent", href: "/recent", icon: Clock },
    { label: "Starred", href: "/starred", icon: Star },
    { label: "Trash", href: "/trash", icon: Trash2 },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between p-4 bg-card border-r border-border select-none">
      <div className="space-y-6">
        {/* Brand Header */}
        <div className="flex items-center justify-between px-2">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-foreground flex items-center gap-1.5">
                KnowDrive
              </span>
              <span className="text-[10px] text-muted-foreground block -mt-0.5 tracking-wider uppercase font-medium">
                Student Knowledge Drive
              </span>
            </div>
          </Link>
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-lg text-muted-foreground hover:bg-muted"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* "+ New" Action Button with Dropdown */}
        <div className="relative px-1">
          <Button
            onClick={() => setShowNewMenu(!showNewMenu)}
            variant="brand"
            className="w-full justify-center shadow-sm h-11 text-sm font-semibold rounded-xl"
          >
            <Plus className="w-4 h-4 mr-2 stroke-[3]" />
            New
          </Button>

          {showNewMenu && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowNewMenu(false)} />
              <div className="absolute left-1 right-1 mt-2 z-40 bg-popover border border-border rounded-xl shadow-xl p-1.5 animate-in fade-in zoom-in-95">
                <button
                  onClick={() => {
                    setShowNewMenu(false);
                    onNewFolderClick();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg hover:bg-muted text-foreground transition-colors"
                >
                  <FolderPlus className="w-4 h-4 text-primary" />
                  <span>New Folder</span>
                </button>
                <button
                  onClick={() => {
                    setShowNewMenu(false);
                    onUploadClick();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg hover:bg-muted text-foreground transition-colors"
                >
                  <UploadCloud className="w-4 h-4 text-emerald-500" />
                  <span>Upload Files</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Core Drive Links */}
        <div className="space-y-1">
          <div className="px-3 text-[11px] font-semibold tracking-wider uppercase text-muted-foreground">
            Storage
          </div>
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href === "/drive" && pathname.startsWith("/drive"));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-muted-foreground")} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Footer Storage Meter & Settings */}
      <div className="space-y-3 pt-4 border-t border-border/60">
        <StorageMeter stats={storageStats} compact />
        <Link
          href="/settings"
          onClick={onCloseMobile}
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors",
            pathname === "/settings" && "bg-muted text-foreground"
          )}
        >
          <Settings className="w-4 h-4 text-muted-foreground" />
          <span>Account &amp; Preferences</span>
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block w-64 h-screen sticky top-0 shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={onCloseMobile} />
          <div className="relative w-72 h-full max-w-full bg-card z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
