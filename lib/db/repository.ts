import {
  DriveFile,
  FolderItem,
  DocumentRecord,
  DocumentChunk,
  Conversation,
  ChatMessage,
  UserProfile,
  StorageBreakdown,
  FileType,
} from "@/types";
import {
  DEMO_USER,
  DEMO_USER_ID,
  SEED_FOLDERS,
  SEED_FILES,
  SEED_DOCUMENTS,
  SEED_CHUNKS,
  SEED_CONVERSATIONS,
  SEED_MESSAGES,
} from "./seed-data";
import { getSupabaseServerClient, isSupabaseConfigured } from "./supabase";

// In-Memory state for local/demo/fallback mode
class InMemoryDb {
  public user: UserProfile = { ...DEMO_USER };
  public folders: FolderItem[] = [...SEED_FOLDERS];
  public files: DriveFile[] = [...SEED_FILES];
  public documents: DocumentRecord[] = [...SEED_DOCUMENTS];
  public chunks: DocumentChunk[] = [...SEED_CHUNKS];
  public conversations: Conversation[] = [...SEED_CONVERSATIONS];
  public messages: ChatMessage[] = [...SEED_MESSAGES];

  reset() {
    this.user = { ...DEMO_USER };
    this.folders = [...SEED_FOLDERS];
    this.files = [...SEED_FILES];
    this.documents = [...SEED_DOCUMENTS];
    this.chunks = [...SEED_CHUNKS];
    this.conversations = [...SEED_CONVERSATIONS];
    this.messages = [...SEED_MESSAGES];
  }
}

// Global singleton across hot reloads in development
const globalForDb = globalThis as unknown as { inMemoryDb?: InMemoryDb };
const memoryDb = globalForDb.inMemoryDb || new InMemoryDb();
if (process.env.NODE_ENV !== "production") globalForDb.inMemoryDb = memoryDb;

export class KnowDriveRepository {
  public userId: string;
  public isDemo: boolean;

  constructor(userId: string = DEMO_USER_ID, isDemo?: boolean) {
    this.userId = userId;
    this.isDemo =
      isDemo !== undefined
        ? isDemo
        : !isSupabaseConfigured || userId === DEMO_USER_ID;
  }

  // --- Profile & Storage ---
  async getProfile(): Promise<UserProfile> {
    if (!this.isDemo && isSupabaseConfigured) {
      const supabase = getSupabaseServerClient();
      if (supabase) {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", this.userId)
          .single();
        if (data && !error) return data as UserProfile;
      }
    }
    // Calculate current storage from memory files
    const totalBytes = memoryDb.files
      .filter((f) => f.user_id === this.userId && !f.is_trashed)
      .reduce((acc, f) => acc + f.size_bytes, 0);
    memoryDb.user.storage_used = totalBytes;
    return memoryDb.user;
  }

  async getStorageBreakdown(): Promise<StorageBreakdown> {
    const profile = await this.getProfile();
    const files = await this.getFiles({ isTrashed: false });

    const totalUsed = files.reduce((acc, f) => acc + f.size_bytes, 0);
    const quota = profile.storage_quota || 1073741824; // 1 GB free tier

    const breakdown: StorageBreakdown = {
      total_bytes: totalUsed,
      quota_bytes: quota,
      used_percentage: Math.min(100, Math.round((totalUsed / quota) * 100)),
      by_type: {
        pdf: { count: 0, bytes: 0 },
        docx: { count: 0, bytes: 0 },
        txt_md: { count: 0, bytes: 0 },
        image: { count: 0, bytes: 0 },
        other: { count: 0, bytes: 0 },
      },
      largest_files: [...files].sort((a, b) => b.size_bytes - a.size_bytes).slice(0, 5),
    };

    for (const f of files) {
      if (f.file_type === "pdf") {
        breakdown.by_type.pdf.count += 1;
        breakdown.by_type.pdf.bytes += f.size_bytes;
      } else if (f.file_type === "docx") {
        breakdown.by_type.docx.count += 1;
        breakdown.by_type.docx.bytes += f.size_bytes;
      } else if (f.file_type === "txt" || f.file_type === "md") {
        breakdown.by_type.txt_md.count += 1;
        breakdown.by_type.txt_md.bytes += f.size_bytes;
      } else if (f.file_type === "image") {
        breakdown.by_type.image.count += 1;
        breakdown.by_type.image.bytes += f.size_bytes;
      } else {
        breakdown.by_type.other.count += 1;
        breakdown.by_type.other.bytes += f.size_bytes;
      }
    }

    return breakdown;
  }

  // --- Folders ---
  async getFolders(parentId?: string | null): Promise<FolderItem[]> {
    if (!this.isDemo && isSupabaseConfigured) {
      const supabase = getSupabaseServerClient();
      if (supabase) {
        let query = supabase.from("folders").select("*").eq("user_id", this.userId);
        if (parentId === null) {
          query = query.is("parent_id", null);
        } else if (parentId) {
          query = query.eq("parent_id", parentId);
        }
        const { data, error } = await query.order("name", { ascending: true });
        if (error) {
          console.error("Supabase getFolders error:", error);
        } else if (data) {
          return data as FolderItem[];
        }
      }
    }

    return memoryDb.folders
      .filter((f) => f.user_id === this.userId && (parentId === undefined || f.parent_id === parentId))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async getAllFolders(): Promise<FolderItem[]> {
    if (!this.isDemo && isSupabaseConfigured) {
      const supabase = getSupabaseServerClient();
      if (supabase) {
        const { data, error } = await supabase
          .from("folders")
          .select("*")
          .eq("user_id", this.userId)
          .order("name", { ascending: true });
        if (!error && data) return data as FolderItem[];
      }
    }
    return memoryDb.folders.filter((f) => f.user_id === this.userId);
  }

  async getFolderById(folderId: string): Promise<FolderItem | null> {
    if (!this.isDemo && isSupabaseConfigured) {
      const supabase = getSupabaseServerClient();
      if (supabase) {
        const { data, error } = await supabase
          .from("folders")
          .select("*")
          .eq("id", folderId)
          .eq("user_id", this.userId)
          .single();
        if (!error && data) return data as FolderItem;
      }
    }
    return memoryDb.folders.find((f) => f.id === folderId && f.user_id === this.userId) || null;
  }

  async createFolder(name: string, parentId?: string | null, color: string = "blue"): Promise<FolderItem> {
    const folderId = crypto.randomUUID();
    const newFolder: FolderItem = {
      id: folderId,
      user_id: this.userId,
      parent_id: parentId || null,
      name: name.trim(),
      color,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (!this.isDemo && isSupabaseConfigured) {
      const supabase = getSupabaseServerClient();
      if (supabase) {
        const { data, error } = await supabase
          .from("folders")
          .insert({
            id: newFolder.id,
            user_id: newFolder.user_id,
            parent_id: newFolder.parent_id,
            name: newFolder.name,
            color: newFolder.color,
          })
          .select()
          .single();

        if (error) {
          console.error("Supabase createFolder error:", error);
          throw new Error(`Failed to create folder in database: ${error.message}`);
        }
        if (data) return data as FolderItem;
      }
    }

    memoryDb.folders.push(newFolder);
    return newFolder;
  }

  async deleteFolder(folderId: string): Promise<boolean> {
    if (!this.isDemo && isSupabaseConfigured) {
      const supabase = getSupabaseServerClient();
      if (supabase) {
        const { error } = await supabase
          .from("folders")
          .delete()
          .eq("id", folderId)
          .eq("user_id", this.userId);
        if (!error) return true;
      }
    }

    memoryDb.folders = memoryDb.folders.filter((f) => f.id !== folderId || f.user_id !== this.userId);
    memoryDb.files.forEach((f) => {
      if (f.folder_id === folderId && f.user_id === this.userId) {
        f.folder_id = null;
      }
    });
    return true;
  }

  // --- Files ---
  async getFiles(options?: {
    folderId?: string | null;
    isStarred?: boolean;
    isTrashed?: boolean;
    fileType?: FileType;
    searchQuery?: string;
  }): Promise<DriveFile[]> {
    if (!this.isDemo && isSupabaseConfigured) {
      const supabase = getSupabaseServerClient();
      if (supabase) {
        let query = supabase.from("files").select("*").eq("user_id", this.userId);

        if (options?.isTrashed !== undefined) {
          query = query.eq("is_trashed", options.isTrashed);
        }
        if (options?.isStarred !== undefined) {
          query = query.eq("is_starred", options.isStarred);
        }
        if (options?.folderId !== undefined) {
          if (options.folderId === null) {
            query = query.is("folder_id", null);
          } else {
            query = query.eq("folder_id", options.folderId);
          }
        }
        if (options?.fileType) {
          query = query.eq("file_type", options.fileType);
        }
        if (options?.searchQuery) {
          query = query.ilike("name", `%${options.searchQuery}%`);
        }

        const { data, error } = await query.order("created_at", { ascending: false });
        if (error) {
          console.error("Supabase getFiles error:", error);
        } else if (data) {
          return data as DriveFile[];
        }
      }
    }

    return memoryDb.files
      .filter((f) => {
        if (f.user_id !== this.userId) return false;
        if (options?.isTrashed !== undefined && f.is_trashed !== options.isTrashed) return false;
        if (options?.isStarred !== undefined && f.is_starred !== options.isStarred) return false;
        if (options?.folderId !== undefined && f.folder_id !== options.folderId) return false;
        if (options?.fileType && f.file_type !== options.fileType) return false;
        if (options?.searchQuery && !f.name.toLowerCase().includes(options.searchQuery.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  async getFileById(fileId: string): Promise<DriveFile | null> {
    if (!this.isDemo && isSupabaseConfigured) {
      const supabase = getSupabaseServerClient();
      if (supabase) {
        const { data, error } = await supabase
          .from("files")
          .select("*")
          .eq("id", fileId)
          .eq("user_id", this.userId)
          .single();
        if (!error && data) return data as DriveFile;
      }
    }
    return memoryDb.files.find((f) => f.id === fileId && f.user_id === this.userId) || null;
  }

  async getFileByIdAdmin(fileId: string): Promise<DriveFile | null> {
    if (!this.isDemo && isSupabaseConfigured) {
      const supabase = getSupabaseServerClient();
      if (supabase) {
        const { data, error } = await supabase
          .from("files")
          .select("*")
          .eq("id", fileId)
          .single();
        if (!error && data) return data as DriveFile;
      }
    }
    return memoryDb.files.find((f) => f.id === fileId) || null;
  }

  async createFile(fileData: Omit<DriveFile, "id" | "created_at" | "updated_at">): Promise<DriveFile> {
    const fileId = crypto.randomUUID();
    const newFile: DriveFile = {
      ...fileData,
      id: fileId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (!this.isDemo && isSupabaseConfigured) {
      const supabase = getSupabaseServerClient();
      if (supabase) {
        const { data, error } = await supabase
          .from("files")
          .insert({
            id: newFile.id,
            user_id: newFile.user_id,
            folder_id: newFile.folder_id,
            name: newFile.name,
            original_name: newFile.original_name,
            mime_type: newFile.mime_type,
            file_type: newFile.file_type,
            size_bytes: newFile.size_bytes,
            storage_path: newFile.storage_path,
            processing_status: newFile.processing_status,
            is_starred: newFile.is_starred,
            is_trashed: newFile.is_trashed,
          })
          .select()
          .single();

        if (error) {
          console.error("Supabase createFile error:", error);
          throw new Error(`Failed to save file in database: ${error.message}`);
        }
        if (data) return data as DriveFile;
      }
    }

    memoryDb.files.unshift(newFile);
    return newFile;
  }

  async updateFile(fileId: string, updates: Partial<DriveFile>): Promise<DriveFile | null> {
    if (!this.isDemo && isSupabaseConfigured) {
      const supabase = getSupabaseServerClient();
      if (supabase) {
        const { data, error } = await supabase
          .from("files")
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq("id", fileId)
          .select()
          .single();
        if (!error && data) return data as DriveFile;
      }
    }

    const file = memoryDb.files.find((f) => f.id === fileId);
    if (!file) return null;
    Object.assign(file, updates, { updated_at: new Date().toISOString() });
    return file;
  }

  async toggleStar(fileId: string): Promise<DriveFile | null> {
    const file = await this.getFileById(fileId);
    if (!file) return null;
    return this.updateFile(fileId, { is_starred: !file.is_starred });
  }

  async moveToTrash(fileId: string): Promise<DriveFile | null> {
    return this.updateFile(fileId, {
      is_trashed: true,
      trashed_at: new Date().toISOString(),
    });
  }

  async restoreFromTrash(fileId: string): Promise<DriveFile | null> {
    return this.updateFile(fileId, {
      is_trashed: false,
      trashed_at: null,
    });
  }

  async permanentlyDeleteFile(fileId: string): Promise<boolean> {
    if (!this.isDemo && isSupabaseConfigured) {
      const supabase = getSupabaseServerClient();
      if (supabase) {
        const { error } = await supabase.from("files").delete().eq("id", fileId);
        if (!error) return true;
      }
    }

    memoryDb.files = memoryDb.files.filter((f) => f.id !== fileId);
    memoryDb.documents = memoryDb.documents.filter((d) => d.file_id !== fileId);
    memoryDb.chunks = memoryDb.chunks.filter((c) => c.file_id !== fileId);
    return true;
  }

  // --- Document & Chunks ---
  async saveDocumentAndChunks(
    docData: Omit<DocumentRecord, "id" | "created_at">,
    chunksData: Omit<DocumentChunk, "id" | "created_at">[]
  ): Promise<{ document: DocumentRecord; chunks: DocumentChunk[] }> {
    const docId = crypto.randomUUID();
    const document: DocumentRecord = {
      ...docData,
      id: docId,
      created_at: new Date().toISOString(),
    };

    const chunks: DocumentChunk[] = chunksData.map((c) => ({
      ...c,
      id: crypto.randomUUID(),
      document_id: docId,
      created_at: new Date().toISOString(),
    }));

    if (!this.isDemo && isSupabaseConfigured) {
      const supabase = getSupabaseServerClient();
      if (supabase) {
        const { error: docErr } = await supabase.from("documents").insert({
          id: document.id,
          file_id: document.file_id,
          user_id: document.user_id,
          title: document.title,
          page_count: document.page_count,
          word_count: document.word_count,
          extracted_text: document.extracted_text,
        });
        if (docErr) console.error("Supabase insert document error:", docErr);

        const { error: chunkErr } = await supabase.from("document_chunks").insert(
          chunks.map((chk) => ({
            id: chk.id,
            document_id: chk.document_id,
            file_id: chk.file_id,
            user_id: chk.user_id,
            chunk_index: chk.chunk_index,
            chunk_text: chk.chunk_text,
            page_number: chk.page_number,
            token_count: chk.token_count,
            embedding: chk.embedding,
            metadata: chk.metadata,
          }))
        );
        if (chunkErr) console.error("Supabase insert chunks error:", chunkErr);

        await supabase
          .from("files")
          .update({
            processing_status: "ready",
            updated_at: new Date().toISOString(),
          })
          .eq("id", docData.file_id);

        return { document, chunks };
      }
    }

    memoryDb.documents.push(document);
    memoryDb.chunks.push(...chunks);
    const file = memoryDb.files.find((f) => f.id === docData.file_id);
    if (file) {
      file.processing_status = "ready";
      file.page_count = docData.page_count;
      file.word_count = docData.word_count;
    }

    return { document, chunks };
  }

  getAllChunks(): DocumentChunk[] {
    return memoryDb.chunks.filter((c) => c.user_id === this.userId);
  }

  async getChunksByFile(fileId: string): Promise<DocumentChunk[]> {
    if (!this.isDemo && isSupabaseConfigured) {
      const supabase = getSupabaseServerClient();
      if (supabase) {
        const { data, error } = await supabase
          .from("document_chunks")
          .select("*")
          .eq("file_id", fileId)
          .eq("user_id", this.userId)
          .order("chunk_index", { ascending: true });
        if (!error && data) return data as DocumentChunk[];
      }
    }
    return memoryDb.chunks
      .filter((c) => c.file_id === fileId && c.user_id === this.userId)
      .sort((a, b) => a.chunk_index - b.chunk_index);
  }

  async getDocumentByFileId(fileId: string): Promise<DocumentRecord | null> {
    if (!this.isDemo && isSupabaseConfigured) {
      const supabase = getSupabaseServerClient();
      if (supabase) {
        const { data, error } = await supabase
          .from("documents")
          .select("*")
          .eq("file_id", fileId)
          .eq("user_id", this.userId)
          .single();
        if (!error && data) return data as DocumentRecord;
      }
    }
    return memoryDb.documents.find((d) => d.file_id === fileId && d.user_id === this.userId) || null;
  }

  // --- Conversations & Messages ---
  async getConversations(): Promise<Conversation[]> {
    if (!this.isDemo && isSupabaseConfigured) {
      const supabase = getSupabaseServerClient();
      if (supabase) {
        const { data, error } = await supabase
          .from("conversations")
          .select("*")
          .eq("user_id", this.userId)
          .order("updated_at", { ascending: false });
        if (!error && data) return data as Conversation[];
      }
    }
    return [...memoryDb.conversations]
      .filter((c) => c.user_id === this.userId)
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  }

  async createConversation(
    title: string,
    scope: Conversation["scope"] = "all_drive",
    targetFileIds: string[] = []
  ): Promise<Conversation> {
    const convId = crypto.randomUUID();
    const newConv: Conversation = {
      id: convId,
      user_id: this.userId,
      title,
      scope,
      target_file_ids: targetFileIds,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (!this.isDemo && isSupabaseConfigured) {
      const supabase = getSupabaseServerClient();
      if (supabase) {
        const { data, error } = await supabase
          .from("conversations")
          .insert({
            id: newConv.id,
            user_id: newConv.user_id,
            title: newConv.title,
            scope: newConv.scope,
            target_file_ids: newConv.target_file_ids,
          })
          .select()
          .single();
        if (error) console.error("Supabase createConversation error:", error);
        if (data) return data as Conversation;
      }
    }

    memoryDb.conversations.unshift(newConv);
    return newConv;
  }

  async getMessages(conversationId: string): Promise<ChatMessage[]> {
    if (!this.isDemo && isSupabaseConfigured) {
      const supabase = getSupabaseServerClient();
      if (supabase) {
        const { data: messages, error } = await supabase
          .from("messages")
          .select("*, message_citations(*)")
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: true });

        if (!error && messages) {
          return messages.map((m) => ({
            id: m.id,
            conversation_id: m.conversation_id,
            user_id: m.user_id,
            role: m.role,
            content: m.content,
            created_at: m.created_at,
            citations: m.message_citations || [],
          }));
        }
      }
    }

    return memoryDb.messages
      .filter((m) => m.conversation_id === conversationId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }

  async addMessage(msg: Omit<ChatMessage, "id" | "created_at">): Promise<ChatMessage> {
    const msgId = crypto.randomUUID();
    const newMsg: ChatMessage = {
      ...msg,
      id: msgId,
      created_at: new Date().toISOString(),
    };

    if (!this.isDemo && isSupabaseConfigured) {
      const supabase = getSupabaseServerClient();
      if (supabase) {
        const { data, error } = await supabase
          .from("messages")
          .insert({
            id: newMsg.id,
            conversation_id: newMsg.conversation_id,
            user_id: this.userId,
            role: newMsg.role,
            content: newMsg.content,
          })
          .select()
          .single();

        if (error) console.error("Supabase addMessage error:", error);

        if (newMsg.citations && newMsg.citations.length > 0) {
          const citationsToInsert = newMsg.citations.map((c) => ({
            id: crypto.randomUUID(),
            message_id: newMsg.id,
            file_id: c.file_id,
            file_name: c.file_name,
            page_number: c.page_number,
            snippet: c.snippet,
          }));
          const { error: citErr } = await supabase.from("message_citations").insert(citationsToInsert);
          if (citErr) console.error("Supabase insert citations error:", citErr);
        }
        if (data) return { ...newMsg, ...data };
      }
    }

    memoryDb.messages.push(newMsg);
    const conv = memoryDb.conversations.find((c) => c.id === msg.conversation_id);
    if (conv) {
      conv.updated_at = new Date().toISOString();
      conv.last_message = msg.content.slice(0, 100);
    }

    return newMsg;
  }
}
