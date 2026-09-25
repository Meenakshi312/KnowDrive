-- KnowDrive Complete Database Schema
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- 2. Users Profiles Table (mirrors Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  storage_used BIGINT DEFAULT 0,
  storage_quota BIGINT DEFAULT 1073741824, -- 1 GB Free Tier default
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Folders Table
CREATE TABLE IF NOT EXISTS public.folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.folders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT 'indigo',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_folders_user_id ON public.folders(user_id);
CREATE INDEX IF NOT EXISTS idx_folders_parent_id ON public.folders(parent_id);

-- 4. Files Table
CREATE TABLE IF NOT EXISTS public.files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES public.folders(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  original_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_type TEXT NOT NULL, -- 'pdf', 'docx', 'txt', 'md', 'image', 'other'
  size_bytes BIGINT NOT NULL,
  storage_path TEXT NOT NULL,
  processing_status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'ready', 'failed'
  error_message TEXT,
  is_starred BOOLEAN DEFAULT FALSE,
  is_trashed BOOLEAN DEFAULT FALSE,
  trashed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_files_user_id ON public.files(user_id);
CREATE INDEX IF NOT EXISTS idx_files_folder_id ON public.files(folder_id);
CREATE INDEX IF NOT EXISTS idx_files_is_trashed ON public.files(is_trashed);
CREATE INDEX IF NOT EXISTS idx_files_is_starred ON public.files(is_starred);
CREATE INDEX IF NOT EXISTS idx_files_file_type ON public.files(file_type);

-- 5. File Permissions Table (for Viewer / Editor / Owner sharing)
CREATE TABLE IF NOT EXISTS public.file_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL REFERENCES public.files(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'viewer', -- 'owner', 'editor', 'viewer'
  granted_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(file_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_file_permissions_file_user ON public.file_permissions(file_id, user_id);

-- 6. Documents Table (Extracted Text & Metadata)
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL REFERENCES public.files(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  page_count INT DEFAULT 1,
  word_count INT DEFAULT 0,
  extracted_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_file_id ON public.documents(file_id);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);

-- 7. Document Chunks & Embeddings Table (pgvector 768 dimensions)
CREATE TABLE IF NOT EXISTS public.document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  file_id UUID NOT NULL REFERENCES public.files(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  chunk_index INT NOT NULL,
  chunk_text TEXT NOT NULL,
  page_number INT DEFAULT 1,
  token_count INT DEFAULT 0,
  embedding vector(768),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chunks_file_id ON public.document_chunks(file_id);
CREATE INDEX IF NOT EXISTS idx_chunks_user_id ON public.document_chunks(user_id);

-- HNSW Vector Index for blazing fast cosine similarity
CREATE INDEX IF NOT EXISTS idx_chunks_embedding_hnsw 
ON public.document_chunks USING hnsw (embedding vector_cosine_ops);

-- 8. Conversations & Messages
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New Conversation',
  scope TEXT DEFAULT 'all_drive', -- 'all_drive', 'folder', 'file', 'comparison'
  target_file_ids UUID[] DEFAULT ARRAY[]::UUID[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON public.conversations(user_id);

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- 'user', 'assistant', 'system'
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conv_id ON public.messages(conversation_id);

-- 9. Message Citations Table
CREATE TABLE IF NOT EXISTS public.message_citations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  file_id UUID NOT NULL REFERENCES public.files(id) ON DELETE CASCADE,
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
  chunk_id UUID REFERENCES public.document_chunks(id) ON DELETE SET NULL,
  file_name TEXT NOT NULL,
  page_number INT DEFAULT 1,
  snippet TEXT NOT NULL,
  relevance_score FLOAT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_citations_message_id ON public.message_citations(message_id);

-- 10. Vector Search Stored Procedure (match_document_chunks)
CREATE OR REPLACE FUNCTION match_document_chunks (
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  filter_user_id uuid,
  filter_file_ids uuid[] DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  document_id uuid,
  file_id uuid,
  file_name text,
  page_number int,
  chunk_text text,
  similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dc.id,
    dc.document_id,
    dc.file_id,
    f.name AS file_name,
    dc.page_number,
    dc.chunk_text,
    1 - (dc.embedding <=> query_embedding) AS similarity
  FROM public.document_chunks dc
  JOIN public.files f ON f.id = dc.file_id
  WHERE dc.user_id = filter_user_id
    AND f.is_trashed = FALSE
    AND (filter_file_ids IS NULL OR dc.file_id = ANY(filter_file_ids))
    AND (1 - (dc.embedding <=> query_embedding)) > match_threshold
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 11. Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_citations ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can only read and update their own profile
CREATE POLICY "Users can manage own profile" ON public.profiles
  FOR ALL USING (auth.uid() = id);

-- Folders: Users can only access their own folders
CREATE POLICY "Users can manage own folders" ON public.folders
  FOR ALL USING (auth.uid() = user_id);

-- Files: Users can access their own files or files shared with them
CREATE POLICY "Users can manage own files" ON public.files
  FOR ALL USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM public.file_permissions fp WHERE fp.file_id = id AND fp.user_id = auth.uid())
  );

-- Chunks: Authorized file access only
CREATE POLICY "Users can read authorized chunks" ON public.document_chunks
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM public.file_permissions fp WHERE fp.file_id = document_chunks.file_id AND fp.user_id = auth.uid())
  );
