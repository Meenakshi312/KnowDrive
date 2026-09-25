export type ProcessingStatus = "pending" | "processing" | "ready" | "failed";

export type FileType = "pdf" | "docx" | "txt" | "md" | "image" | "other";

export type PermissionRole = "owner" | "editor" | "viewer";

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  storage_used: number; // in bytes
  storage_quota: number; // in bytes (e.g. 1GB default)
  created_at: string;
  updated_at: string;
}

export interface FolderItem {
  id: string;
  user_id: string;
  parent_id?: string | null;
  name: string;
  color?: string;
  created_at: string;
  updated_at: string;
}

export interface DriveFile {
  id: string;
  user_id: string;
  folder_id?: string | null;
  name: string;
  original_name: string;
  mime_type: string;
  file_type: FileType;
  size_bytes: number;
  storage_path: string;
  processing_status: ProcessingStatus;
  error_message?: string | null;
  is_starred: boolean;
  is_trashed: boolean;
  trashed_at?: string | null;
  created_at: string;
  updated_at: string;
  // joined fields
  download_url?: string;
  page_count?: number;
  word_count?: number;
}

export interface DocumentRecord {
  id: string;
  file_id: string;
  user_id: string;
  title: string;
  page_count: number;
  word_count: number;
  extracted_text?: string;
  created_at: string;
}

export interface DocumentChunk {
  id: string;
  document_id: string;
  file_id: string;
  user_id: string;
  chunk_index: number;
  chunk_text: string;
  page_number: number;
  token_count: number;
  embedding?: number[];
  metadata?: Record<string, unknown>;
  created_at?: string;
  // similarity score from vector match
  similarity?: number;
  file_name?: string;
}

export interface FilePermission {
  id: string;
  file_id: string;
  user_id: string;
  role: PermissionRole;
  granted_by: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  scope: "all_drive" | "folder" | "file" | "comparison";
  target_file_ids: string[];
  created_at: string;
  updated_at: string;
  last_message?: string;
}

export interface MessageCitation {
  id: string;
  message_id: string;
  file_id: string;
  document_id?: string;
  chunk_id?: string;
  file_name: string;
  page_number: number;
  snippet: string;
  relevance_score?: number;
  created_at?: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  user_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
  citations?: MessageCitation[];
}

export interface ComparisonResult {
  common_skills: string[];
  missing_skills: string[];
  relevant_experience: string[];
  conflicting_information?: string[];
  supporting_evidence: {
    point: string;
    file_name: string;
    page_number?: number;
    quote: string;
  }[];
  summary: string;
}

export interface StorageBreakdown {
  total_bytes: number;
  quota_bytes: number;
  used_percentage: number;
  by_type: {
    pdf: { count: number; bytes: number };
    docx: { count: number; bytes: number };
    txt_md: { count: number; bytes: number };
    image: { count: number; bytes: number };
    other: { count: number; bytes: number };
  };
  largest_files: DriveFile[];
}
