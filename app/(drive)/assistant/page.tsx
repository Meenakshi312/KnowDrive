"use client";

import React, { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useDrive } from "@/components/drive/DriveContext";
import { AiAssistantView } from "@/components/ai/AiAssistantView";

function AssistantPageContent() {
  const { openCitation, files, setIsCompareOpen } = useDrive();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("mode") === "compare") {
      setIsCompareOpen(true);
    }
  }, [searchParams, setIsCompareOpen]);

  return <AiAssistantView onOpenCitation={openCitation} files={files} />;
}

export default function AssistantPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-muted-foreground">Loading assistant...</div>}>
      <AssistantPageContent />
    </Suspense>
  );
}
