import { NextRequest, NextResponse } from "next/server";
import { KnowDriveRepository } from "@/lib/db/repository";
import { executeRagChat } from "@/lib/ai/rag";
import { getCurrentUser } from "@/lib/db/auth-server";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { query, conversationId, targetFileIds, scope } = await req.json();

    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    const repo = new KnowDriveRepository(user.id, user.isDemo);
    let currentConvId = conversationId;

    if (!currentConvId) {
      const conv = await repo.createConversation(
        query.slice(0, 45) + (query.length > 45 ? "..." : ""),
        scope || "all_drive",
        targetFileIds || []
      );
      currentConvId = conv.id;
    }

    // Save user message
    await repo.addMessage({
      conversation_id: currentConvId,
      user_id: user.id,
      role: "user",
      content: query,
    });

    // Execute RAG question answering with citations
    const { answer, citations } = await executeRagChat(
      repo,
      user.id,
      query,
      targetFileIds
    );

    // Save assistant message with citations
    const assistantMsg = await repo.addMessage({
      conversation_id: currentConvId,
      user_id: user.id,
      role: "assistant",
      content: answer,
      citations,
    });

    return NextResponse.json({
      conversationId: currentConvId,
      message: assistantMsg,
      citations,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Chat failed";
    console.error("Chat API error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get("conversation_id");

    const repo = new KnowDriveRepository(user.id, user.isDemo);
    if (conversationId) {
      const messages = await repo.getMessages(conversationId);
      return NextResponse.json({ messages });
    }

    const conversations = await repo.getConversations();
    return NextResponse.json({ conversations });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch conversations";
    console.error("Fetch conversations error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
