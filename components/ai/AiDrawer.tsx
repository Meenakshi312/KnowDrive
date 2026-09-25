"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Send,
  X,
  Bot,
  Loader2,
  Trash2,
  Layers,
  FileText,
  RotateCcw,
} from "lucide-react";
import { ChatMessage } from "./ChatMessage";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { PrivacyIndicator } from "./PrivacyIndicator";
import { ChatMessage as ChatMessageType, MessageCitation, DriveFile } from "@/types";
import { useDrive } from "../drive/DriveContext";
import { toast } from "sonner";

interface AiDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeFile?: DriveFile | null;
  onOpenCitation: (citation: MessageCitation) => void;
}

export function AiDrawer({ isOpen, onClose, activeFile, onOpenCitation }: AiDrawerProps) {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [currentTargetFile, setCurrentTargetFile] = useState<DriveFile | null>(activeFile || null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { files } = useDrive();
  const activeFiles = files.filter((f) => !f.is_trashed);

  // Synchronize target file when activeFile prop changes or drawer opens
  useEffect(() => {
    if (isOpen) {
      setCurrentTargetFile(activeFile || null);
      setConversationId(null);
      setMessages([]);
    }
  }, [isOpen, activeFile]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  if (!isOpen) return null;

  const suggestedPrompts = currentTargetFile
    ? [
        `Who is the applicant or author in ${currentTargetFile.name}?`,
        `Summarize the key points of ${currentTargetFile.name}`,
        `What qualifications, skills, and details are in ${currentTargetFile.name}?`,
      ]
    : [
        "Who is the applicant and what are the details in my documents?",
        "Summarize the technical skills and qualifications across my files",
        "Compare the key findings across my stored documents",
      ];

  const handleSend = async (queryText?: string) => {
    const text = (queryText || input).trim();
    if (!text || loading) return;

    setInput("");
    const userMsg: ChatMessageType = {
      id: "temp-" + Date.now(),
      conversation_id: conversationId || "new",
      user_id: "00000000-0000-0000-0000-000000000001",
      role: "user",
      content: text,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: text,
          conversationId,
          targetFileIds: currentTargetFile ? [currentTargetFile.id] : undefined,
          scope: currentTargetFile ? "file" : "all_drive",
        }),
      });

      if (!res.ok) {
        throw new Error("Chat request failed");
      }

      const data = await res.json();
      if (data.conversationId) setConversationId(data.conversationId);
      if (data.message) {
        setMessages((prev) => [...prev, data.message]);
      }
    } catch (err: unknown) {
      toast.error("Failed to generate response. Check AI connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages([]);
    setConversationId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over Drawer Panel */}
      <div className="relative w-full max-w-xl h-full bg-card border-l border-border shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-4 border-b border-border flex items-center justify-between bg-card/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-foreground">Ask Assistant</h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  AI Copilot
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {currentTargetFile
                  ? `Focused on: ${currentTargetFile.name}`
                  : "Searching across all stored documents"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleResetChat}
              className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              title="Start fresh conversation"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              title="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Target Document Switcher / Indicator Banner */}
        {currentTargetFile ? (
          <div className="flex items-center justify-between px-4 py-2 bg-indigo-50/70 dark:bg-indigo-950/30 border-b border-indigo-100 dark:border-indigo-900/30 text-xs shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <FileText className="w-4 h-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
              <span className="font-semibold text-foreground truncate max-w-[260px]">
                {currentTargetFile.name}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-medium shrink-0">
                Target File
              </span>
            </div>
            <button
              onClick={() => {
                setCurrentTargetFile(null);
                handleResetChat();
              }}
              className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline shrink-0 ml-2"
            >
              Search All Files
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between px-4 py-2 bg-muted/30 border-b border-border text-xs shrink-0">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 shrink-0 text-primary" />
              <span className="text-muted-foreground font-medium">Searching all documents</span>
            </div>
            {activeFiles.length > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-muted-foreground hidden sm:inline">Focus on file:</span>
                <select
                  aria-label="Focus on specific file"
                  value=""
                  onChange={(e) => {
                    const selected = activeFiles.find((f) => f.id === e.target.value);
                    if (selected) {
                      setCurrentTargetFile(selected);
                      handleResetChat();
                    }
                  }}
                  className="text-[11px] bg-background border border-border rounded-lg px-2 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-primary max-w-[160px] truncate"
                >
                  <option value="" disabled>
                    Select a file...
                  </option>
                  {activeFiles.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {/* AI Privacy Alert */}
        <div className="px-4 py-2 bg-muted/20 border-b border-border/50 shrink-0">
          <PrivacyIndicator compact />
        </div>

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                <Bot className="w-6 h-6" />
              </div>
              <div className="space-y-1 max-w-sm">
                <h4 className="text-base font-bold text-foreground">
                  {currentTargetFile
                    ? `Ask about ${currentTargetFile.name}`
                    : "What would you like to know?"}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {currentTargetFile
                    ? "Ask questions regarding applicant details, qualifications, or key facts in this document."
                    : "Ask cross-file questions, query specific technical projects, compare skills, or find answers with clickable citations."}
                </p>
              </div>

              {/* Suggested Questions */}
              <div className="w-full space-y-2 pt-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-left">
                  Suggested Questions
                </p>
                <div className="flex flex-col gap-2">
                  {suggestedPrompts.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(prompt)}
                      className="text-left text-xs p-3 rounded-xl bg-muted/40 hover:bg-muted border border-border/60 hover:border-indigo-500/40 text-foreground transition-all"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              {messages.map((m) => (
                <ChatMessage key={m.id} message={m} onCitationClick={onOpenCitation} />
              ))}

              {loading && (
                <div className="flex items-center gap-2 p-3 text-xs text-muted-foreground bg-muted/40 rounded-xl w-fit">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span>Searching document chunks & synthesizing answer...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-border bg-card/80 shrink-0 space-y-2">
          {/* Active file target chip if set */}
          {currentTargetFile && (
            <div className="flex items-center justify-between text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg w-fit max-w-full">
              <div className="flex items-center gap-1.5 truncate">
                <FileText className="w-3.5 h-3.5 shrink-0" />
                <span className="font-semibold truncate">{currentTargetFile.name}</span>
              </div>
              <button
                onClick={() => {
                  setCurrentTargetFile(null);
                  handleResetChat();
                }}
                className="ml-2 hover:text-foreground"
                title="Remove file focus"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                currentTargetFile
                  ? `Ask a question about ${currentTargetFile.name}...`
                  : "Ask anything about your files..."
              }
              className="h-10 text-xs rounded-xl"
              disabled={loading}
              autoFocus
            />
            <Button
              type="submit"
              variant="brand"
              size="icon"
              className="h-10 w-10 shrink-0 rounded-xl"
              disabled={!input.trim() || loading}
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
