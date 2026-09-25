"use client";

import React from "react";
import { Bot, User, Sparkles, FileText, ExternalLink, Bookmark } from "lucide-react";
import { ChatMessage as ChatMessageType, MessageCitation } from "@/types";

interface ChatMessageProps {
  message: ChatMessageType;
  onCitationClick?: (citation: MessageCitation) => void;
}

export function ChatMessage({ message, onCitationClick }: ChatMessageProps) {
  const isAssistant = message.role === "assistant";

  // Parse markdown-style citations [Doc.pdf — Page X] into interactive inline pills
  const renderFormattedContent = (content: string) => {
    // Split by citation brackets like [Filename.pdf — Page X]
    const regex = /\[([a-zA-Z0-9_\-.]+\.(?:pdf|docx|md|txt))\s*—\s*(?:Page\s*(\d+))?\]/gi;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push(content.substring(lastIndex, match.index));
      }

      const fileName = match[1];
      const pageNumber = match[2] ? parseInt(match[2], 10) : 1;

      // Find matching citation object if available
      const matchingCitation = message.citations?.find(
        (c) => c.file_name.toLowerCase() === fileName.toLowerCase()
      ) || {
        id: "inline-cit-" + Math.random(),
        message_id: message.id,
        file_id: "",
        file_name: fileName,
        page_number: pageNumber,
        snippet: `Reference in ${fileName} on Page ${pageNumber}`,
      };

      parts.push(
        <button
          key={`inline-cit-${match.index}`}
          onClick={() => onCitationClick && onCitationClick(matchingCitation)}
          className="inline-flex items-center gap-1 mx-1 px-2 py-0.5 rounded-md bg-primary/10 hover:bg-primary/20 text-primary font-mono text-xs border border-primary/25 transition-all hover:scale-105 align-baseline"
          title={`Click to open ${fileName} at Page ${pageNumber}`}
        >
          <Bookmark className="w-3 h-3 shrink-0" />
          <span className="font-semibold">{fileName}</span>
          <span className="opacity-75">• P.{pageNumber}</span>
        </button>
      );

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex));
    }

    return parts;
  };

  return (
    <div className={`flex gap-3 text-sm ${isAssistant ? "justify-start" : "justify-end"}`}>
      {isAssistant && (
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-emerald-500/20">
          <Bot className="w-4 h-4" />
        </div>
      )}

      <div
        className={`max-w-[85%] rounded-2xl p-4 shadow-sm space-y-3 ${
          isAssistant
            ? "bg-card border border-border text-foreground"
            : "bg-primary text-primary-foreground font-medium"
        }`}
      >
        <div className="whitespace-pre-wrap leading-relaxed">
          {isAssistant ? renderFormattedContent(message.content) : message.content}
        </div>

        {/* Citations Footer Section for Assistant answers */}
        {isAssistant && message.citations && message.citations.length > 0 && (
          <div className="pt-3 border-t border-border/60 space-y-2">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <FileText className="w-3.5 h-3.5 text-primary" />
              <span>Grounded Document Sources ({message.citations.length})</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {message.citations.map((citation) => (
                <button
                  key={citation.id}
                  onClick={() => onCitationClick && onCitationClick(citation)}
                  className="group flex items-center gap-2 p-2 rounded-xl bg-muted/50 hover:bg-muted border border-border text-left transition-all hover:border-primary/50"
                  title="Click to preview file at cited page"
                >
                  <FileText className="w-3.5 h-3.5 text-primary shrink-0 group-hover:scale-110 transition-transform" />
                  <div className="truncate max-w-[200px]">
                    <p className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                      {citation.file_name}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Page {citation.page_number} • Click to open
                    </p>
                  </div>
                  <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ml-1" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {!isAssistant && (
        <div className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center text-secondary-foreground shrink-0 border border-border">
          <User className="w-4 h-4" />
        </div>
      )}
    </div>
  );
}
