"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Send,
  Plus,
  MessageSquare,
  Bot,
  Loader2,
  Trash2,
  Layers,
  FileText,
  ShieldCheck,
  Search,
  X,
  RotateCcw,
} from "lucide-react";
import { ChatMessage } from "./ChatMessage";
import { PrivacyIndicator } from "./PrivacyIndicator";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Conversation, ChatMessage as ChatMessageType, MessageCitation, DriveFile } from "@/types";
import { toast } from "sonner";

interface AiAssistantViewProps {
  onOpenCitation: (citation: MessageCitation) => void;
  files: DriveFile[];
  onClose?: () => void;
}

export function AiAssistantView({ onOpenCitation, files, onClose }: AiAssistantViewProps) {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentTargetFile, setCurrentTargetFile] = useState<DriveFile | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeFiles = files.filter((f) => !f.is_trashed);

  // Load conversations on mount
  useEffect(() => {
    fetch("/api/chat")
      .then((res) => res.json())
      .then((data) => {
        if (data.conversations && data.conversations.length > 0) {
          setConversations(data.conversations);
          setActiveConvId(data.conversations[0].id);
        }
      })
      .catch((e) => console.error("Error loading conversations:", e));
  }, []);

  // Load messages whenever active conversation changes
  useEffect(() => {
    if (!activeConvId) {
      setMessages([]);
      return;
    }
    fetch(`/api/chat?conversation_id=${activeConvId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.messages) setMessages(data.messages);
      })
      .catch((e) => console.error("Error loading messages:", e));
  }, [activeConvId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleNewConversation = () => {
    setActiveConvId(null);
    setMessages([]);
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      router.push("/");
    }
  };

  const handleSendMessage = async (customPrompt?: string) => {
    const text = (customPrompt || input).trim();
    if (!text || loading) return;

    setInput("");
    const userMsg: ChatMessageType = {
      id: "temp-" + Date.now(),
      conversation_id: activeConvId || "new",
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
          conversationId: activeConvId,
          targetFileIds: currentTargetFile ? [currentTargetFile.id] : undefined,
          scope: currentTargetFile ? "file" : "all_drive",
        }),
      });

      if (!res.ok) throw new Error("Chat request failed");

      const data = await res.json();
      if (data.conversationId && data.conversationId !== activeConvId) {
        setActiveConvId(data.conversationId);
        // Refresh conversations list
        fetch("/api/chat")
          .then((r) => r.json())
          .then((d) => d.conversations && setConversations(d.conversations));
      }

      if (data.message) {
        setMessages((prev) => [...prev, data.message]);
      }
    } catch (err: unknown) {
      toast.error("Failed to generate response. Please retry.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-background">
      {/* Conversations History Sidebar */}
      <div className="w-72 border-r border-border bg-card/60 flex flex-col justify-between shrink-0 hidden md:flex">
        <div className="p-4 space-y-4">
          <Button
            onClick={handleNewConversation}
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2 h-10 rounded-xl font-semibold border-primary/20 text-primary hover:bg-primary/5"
          >
            <Plus className="w-4 h-4" />
            New Conversation
          </Button>

          <div className="space-y-1">
            <p className="px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Recent Threads
            </p>
            <div className="space-y-1 max-h-[60vh] overflow-y-auto pr-1">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setActiveConvId(conv.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-left transition-colors truncate ${
                    activeConvId === conv.id
                      ? "bg-secondary text-foreground font-semibold shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5 shrink-0 text-primary" />
                  <span className="truncate">{conv.title}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-border/60">
          <PrivacyIndicator compact />
        </div>
      </div>

      {/* Main Chat Center Area */}
      <div className="flex-1 flex flex-col justify-between overflow-hidden">
        {/* Top Header Controls: Target File Selector & Close Icon */}
        <div className="px-4 py-2.5 border-b border-border bg-card/80 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-xs font-bold text-foreground">AI Assistant</span>
              <span className="text-[10px] text-muted-foreground ml-2 hidden sm:inline">
                {currentTargetFile ? `Focused on: ${currentTargetFile.name}` : "Searching across stored documents"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeFiles.length > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-muted-foreground hidden sm:inline">Focus on file:</span>
                <select
                  aria-label="Focus on specific file"
                  value={currentTargetFile?.id || ""}
                  onChange={(e) => {
                    const selected = activeFiles.find((f) => f.id === e.target.value);
                    setCurrentTargetFile(selected || null);
                    handleNewConversation();
                  }}
                  className="text-xs bg-background border border-border rounded-lg px-2.5 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-primary max-w-[180px] sm:max-w-[240px] truncate"
                >
                  <option value="">All Drive Files</option>
                  {activeFiles.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={handleClose}
              className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors ml-1"
              title="Close assistant"
              aria-label="Close assistant"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Chat Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {messages.length === 0 ? (
            <div className="max-w-2xl mx-auto py-12 flex flex-col items-center justify-center text-center space-y-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <Sparkles className="w-7 h-7" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">
                  {currentTargetFile ? `Ask about ${currentTargetFile.name}` : "Ask your Knowledge Drive"}
                </h2>
                <p className="text-sm text-muted-foreground max-w-md">
                  {currentTargetFile
                    ? `Ask questions regarding applicant details, qualifications, or key facts in ${currentTargetFile.name}.`
                    : "Reason across multiple files simultaneously, extract project evidence, identify missing skills, and get answers with clickable source citations."}
                </p>
              </div>

              <PrivacyIndicator className="w-full text-left" />
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-6">
              {messages.map((m) => (
                <ChatMessage key={m.id} message={m} onCitationClick={onOpenCitation} />
              ))}

              {loading && (
                <div className="flex items-center gap-2 p-3 text-xs text-muted-foreground bg-muted/40 rounded-xl w-fit">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span>Retrieving document chunks from pgvector & generating grounded answer...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-border bg-card/70 backdrop-blur-md shrink-0 space-y-2">
          {currentTargetFile && (
            <div className="max-w-3xl mx-auto flex items-center justify-between text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg w-fit max-w-full">
              <div className="flex items-center gap-1.5 truncate">
                <FileText className="w-3.5 h-3.5 shrink-0" />
                <span className="font-semibold truncate">{currentTargetFile.name}</span>
              </div>
              <button
                onClick={() => {
                  setCurrentTargetFile(null);
                  handleNewConversation();
                }}
                className="ml-2 hover:text-foreground"
                title="Remove file focus"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="max-w-3xl mx-auto">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  currentTargetFile
                    ? `Ask a question about ${currentTargetFile.name}...`
                    : "Ask anything across your entire drive..."
                }
                className="h-11 rounded-xl text-sm"
                disabled={loading}
                autoFocus
              />
              <Button
                type="submit"
                variant="brand"
                size="icon"
                className="h-11 w-11 shrink-0 rounded-xl"
                disabled={!input.trim() || loading}
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
