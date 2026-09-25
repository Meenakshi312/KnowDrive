"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Sparkles,
  Menu,
  User,
  LogOut,
  Settings,
  ChevronDown,
  X,
  FileText,
  Eye,
} from "lucide-react";
import { ThemeToggle } from "../ui/ThemeToggle";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { UserProfile } from "@/types";
import { useDrive } from "./DriveContext";
import { toast } from "sonner";

interface HeaderProps {
  user: UserProfile | null;
  onOpenMobileMenu: () => void;
  onOpenAiDrawer: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isSemanticSearch: boolean;
  onToggleSemanticSearch: () => void;
}

export function Header({
  user,
  onOpenMobileMenu,
  onOpenAiDrawer,
  searchQuery,
  onSearchChange,
  isSemanticSearch,
  onToggleSemanticSearch,
}: HeaderProps) {
  const router = useRouter();
  const { files, openPreview, openAiForFile } = useDrive();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      toast.success("Signed out successfully");
      window.location.href = "/login";
    } catch {
      window.location.href = "/login";
    }
  };

  const matchingFiles = searchQuery.trim()
    ? files.filter((f) => !f.is_trashed && f.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push("/drive");
      setSearchFocused(false);
    }
  };

  const displayName = user?.full_name || "Student User";
  const displayEmail = user?.email || "student@knowdrive.dev";

  return (
    <header className="h-16 px-4 md:px-6 border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between gap-4">
      {/* Mobile Menu Toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Unified Search Bar with Live Results Dropdown */}
      <div className="flex-1 max-w-2xl mx-auto relative" ref={searchContainerRef}>
        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <Input
            value={searchQuery}
            onChange={(e) => {
              onSearchChange(e.target.value);
              setSearchFocused(true);
            }}
            onFocus={() => setSearchFocused(true)}
            placeholder={
              isSemanticSearch
                ? "AI Semantic Search: e.g. 'documents about system design' or 'formulas'..."
                : "Search files, folders, and documents by name..."
            }
            icon={
              isSemanticSearch ? (
                <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Search className="w-4 h-4 text-muted-foreground" />
              )
            }
            className={`h-10 pr-28 text-sm rounded-xl transition-all ${
              isSemanticSearch
                ? "border-emerald-500/50 shadow-sm shadow-emerald-500/10 focus-visible:ring-emerald-500"
                : "bg-muted/40 focus:bg-background"
            }`}
          />

          <div className="absolute right-2 top-1.5 bottom-1.5 flex items-center gap-1.5">
            {/* Clear Search Button */}
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  onSearchChange("");
                  setSearchFocused(false);
                }}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
                title="Clear search"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Search Mode Toggle pill */}
            <button
              type="button"
              onClick={onToggleSemanticSearch}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                isSemanticSearch
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
              title="Toggle between regular filename search and AI semantic knowledge search"
            >
              {isSemanticSearch ? (
                <>
                  <Sparkles className="w-3 h-3" />
                  <span>AI Search</span>
                </>
              ) : (
                <>
                  <Search className="w-3 h-3" />
                  <span>Exact</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Live Search Results Dropdown */}
        {searchFocused && searchQuery.trim().length > 0 && (
          <div className="absolute left-0 right-0 mt-2 bg-card border border-border rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/60 text-xs">
              <span className="font-semibold text-muted-foreground">
                Search Results ({matchingFiles.length})
              </span>
              <button
                onClick={() => {
                  router.push("/drive");
                  setSearchFocused(false);
                }}
                className="text-[11px] font-semibold text-primary hover:underline"
              >
                View all in Drive &rarr;
              </button>
            </div>

            {matchingFiles.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground">
                No documents found matching &ldquo;{searchQuery}&rdquo;
              </div>
            ) : (
              <div className="divide-y divide-border/40 py-1">
                {matchingFiles.slice(0, 6).map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-muted/70 transition-colors group cursor-pointer"
                    onClick={() => {
                      openPreview(file);
                      setSearchFocused(false);
                    }}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                          {file.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {((file.size_bytes || 0) / (1024 * 1024)).toFixed(2)} MB &bull; {new Date(file.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="h-7 px-2 text-[11px] rounded-lg gap-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          openPreview(file);
                          setSearchFocused(false);
                        }}
                      >
                        <Eye className="w-3 h-3" />
                        <span>Preview</span>
                      </Button>
                      <Button
                        type="button"
                        variant="brand"
                        size="sm"
                        className="h-7 px-2 text-[11px] rounded-lg gap-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          openAiForFile(file);
                          setSearchFocused(false);
                        }}
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Ask AI</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Controls: AI Assistant, Theme Toggle, Profile */}
      <div className="flex items-center gap-2 md:gap-3 shrink-0">
        <Button
          onClick={onOpenAiDrawer}
          variant="brand"
          size="sm"
          className="h-9 px-3.5 rounded-xl text-xs font-semibold shadow-sm hidden sm:inline-flex"
        >
          <Sparkles className="w-3.5 h-3.5 mr-1.5" />
          <span>Ask Assistant</span>
        </Button>

        <ThemeToggle />

        {/* User Avatar & Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 pl-2 border-l border-border hover:opacity-80 transition-opacity"
            aria-label="User profile menu"
          >
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={displayName}
                className="w-8 h-8 rounded-full object-cover border border-border"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-xs border border-primary/20">
                {displayName[0]?.toUpperCase() || "S"}
              </div>
            )}
            <div className="hidden xl:block text-left">
              <p className="text-xs font-semibold text-foreground leading-tight">
                {displayName}
              </p>
              <p className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                {displayEmail}
              </p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground hidden xl:block" />
          </button>

          {/* Profile Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-card border border-border shadow-xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-3 py-2 border-b border-border/60">
                <p className="text-xs font-bold text-foreground truncate">{displayName}</p>
                <p className="text-[11px] text-muted-foreground truncate">{displayEmail}</p>
              </div>

              <div className="py-1">
                <Link
                  href="/settings"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-foreground hover:bg-muted font-medium transition-colors"
                >
                  <Settings className="w-4 h-4 text-muted-foreground" />
                  <span>Account &amp; Preferences</span>
                </Link>
              </div>

              <div className="pt-1 border-t border-border/60">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-destructive hover:bg-destructive/10 font-medium transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
