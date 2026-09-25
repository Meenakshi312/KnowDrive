"use client";

import React, { useState, useEffect, useRef } from "react";
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
}

export function AiAssistantView({ onOpenCitation, files }: AiAssistantViewProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedQuestions = [
    "Which projects in my Drive demonstrate skills missing from the job description?",
    "What did I do in my OpenFOAM project?",
    "What PostgreSQL & pgvector projects have I worked on?",
    "Summarize my machine learning projects and findings.",
    "Compare my resume with the Staff AI Engineer job description.",
    "What are the main topics in my notes?",
  ];

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
          scope: "all_drive",
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
        {/* Chat Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {messages.length === 0 ? (
            <div className="max-w-2xl mx-auto py-12 flex flex-col items-center justify-center text-center space-y-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <Sparkles className="w-7 h-7" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">
                  Ask your Knowledge Drive
                </h2>
                <p className="text-sm text-muted-foreground max-w-md">
                  Reason across multiple files simultaneously, extract project evidence, identify missing skills, and get answers with clickable source citations.
                </p>
              </div>

              <PrivacyIndicator className="w-full text-left" />

              {/* Suggested Questions Grid */}
              <div className="w-full space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-left">
                  Sample Prompts & Cross-File Queries
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {suggestedQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(q)}
                      className="p-3.5 rounded-2xl bg-card border border-border hover:border-primary/50 text-left text-xs text-foreground transition-all hover:shadow-md flex items-start gap-2.5 group"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-indigo-500 mt-0.5 shrink-0 group-hover:scale-110 transition-transform" />
                      <span className="leading-relaxed">{q}</span>
                    </button>
                  ))}
                </div>
              </div>
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
        <div className="p-4 border-t border-border bg-card/70 backdrop-blur-md shrink-0">
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
                placeholder="Ask anything across your entire drive (e.g. 'Compare my resume with this job description')..."
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
