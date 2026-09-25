# KnowDrive — "Your files, understood."

> **Production-Quality Full-Stack AI Personal Knowledge Drive** combining cloud drive management with an AI knowledge assistant powered by Google Gemini, PostgreSQL, and pgvector.

---

## 1. Architecture Overview

KnowDrive is built as a modern Next.js monolith using the stable App Router architecture.

```
                      ┌──────────────────────────────────────┐
                      │    Client (Next.js 15 + React 19)    │
                      │  Tailwind CSS + shadcn/ui + Lucide   │
                      └──────────────────┬───────────────────┘
                                         │
                                         ▼
                      ┌──────────────────────────────────────┐
                      │        Next.js Route Handlers        │
                      │   /api/files, /api/chat, /api/search │
                      └───────┬──────────────┬───────────────┘
                              │              │
             ┌────────────────┘              └────────────────┐
             ▼                                                ▼
┌─────────────────────────┐                      ┌─────────────────────────┐
│ Supabase Cloud          │                      │ Google Gemini AI        │
│ ├─ Supabase Auth        │                      │ ├─ gemini-3.8-flash     │
│ ├─ Private File Storage │                      │ │  (RAG & Reasoning)    │
│ └─ PostgreSQL + pgvector│                      │ └─ gemini-embedding-001 │
│    (Chunks & HNSW Index)│                      │    (768-dim Embeddings) │
└─────────────────────────┘                      └─────────────────────────┘
```

* **Frontend**: Next.js App Router, TypeScript, React 19, Tailwind CSS, Radix UI headless primitives, Lucide React icons, and `next-themes` (Dark/Light mode).
* **Backend**: Server Actions and Route Handlers with server-side secret isolation.
* **Database & Vector Search**: Supabase PostgreSQL with `pgvector` extension and HNSW cosine similarity index.
* **AI Copilot**: Clean server abstraction in `lib/ai/` using `@google/genai` (current official SDK) running `gemini-3.8-flash` for multi-document reasoning and `gemini-embedding-001` (768 dimensions) for embeddings.
* **Document Parser**: Page-aware extraction supporting PDF (`pdf-parse`), DOCX (`mammoth`), Markdown, and plain text.
* **Security**: Multi-tenant Row-Level Security (RLS) policies guaranteeing cryptographic isolation between users.
* **Dual-Mode Operation**: Operates with live Supabase and Google Gemini keys, or in standalone Demo Mode with high-fidelity seed data for portfolio evaluation.

---

## 2. Database Schema Explanation

The schema is defined in [`lib/db/schema.sql`](file:///c:/KnowDrive/lib/db/schema.sql) and uses PostgreSQL with the `vector` extension:

1. **`profiles`**: Mirrors `auth.users`, tracks tenant metadata, storage quota (1 GB Free Tier), and calculated storage used.
2. **`folders`**: Nested hierarchical folder structure with self-referencing `parent_id` foreign key.
3. **`files`**: File metadata including original name, MIME type, file size, private storage path, star/trash flags, and asynchronous processing status (`pending`, `processing`, `ready`, `failed`). Binary contents are stored in object storage, not in PostgreSQL.
4. **`file_permissions`**: Granular access control (`owner`, `editor`, `viewer`) for document sharing.
5. **`documents`**: Document records storing extracted plain text, total word counts, and page counts.
6. **`document_chunks`**: Document chunks with token count, page number preservation, and 768-dimensional `embedding vector(768)` with an HNSW cosine index.
7. **`conversations` & `messages`**: Multi-turn chat sessions scoped to single documents, selected files, or the entire drive.
8. **`message_citations`**: Grounded source links mapping factual claims to specific file IDs, page numbers, and exact text snippets.
9. **`match_document_chunks()`**: PostgreSQL stored procedure executing vector similarity searches filtered strictly by `user_id` and document authorizations.

---

## 3. Environment Variables Required

Create a `.env.local` file based on [`.env.example`](file:///c:/KnowDrive/.env.example):

```bash
# Public variables exposed to client
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Server-only private secrets (NEVER exposed to client)
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
GEMINI_API_KEY=your-gemini-api-key
DATABASE_URL=postgresql://postgres.your-project:password@aws-0-region.pooler.supabase.com:6543/postgres
SUPABASE_STORAGE_BUCKET=knowdrive-files

# Mode setting: set to 'true' to allow offline portfolio demo testing
ENABLE_DEMO_MODE=true
```

---

## 4. Local Setup Instructions

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/KnowDrive.git
   cd KnowDrive
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment**:
   ```bash
   cp .env.example .env.local
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```

5. **Open in browser**:
   Navigate to [http://localhost:3000](http://localhost:3000). You will immediately enter the dashboard with pre-seeded engineering documents (Resume, Job Description, Cloud Storage Report, OpenFOAM CFD Simulation, DSA Notes).

6. **Run tests**:
   ```bash
   npm test
   ```

---

## 5. Supabase Setup Instructions (Free Tier)

1. Sign up for a free project at [supabase.com](https://supabase.com).
2. In the **SQL Editor**, paste and execute the entire content of [`lib/db/schema.sql`](file:///c:/KnowDrive/lib/db/schema.sql).
3. Under **Storage**, create a new bucket named `knowdrive-files` and set it to **Private**.
4. Under **Project Settings > API**, copy:
   - Project URL -> `NEXT_PUBLIC_SUPABASE_URL`
   - Project API Key (anon/public) -> `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Project API Key (service_role secret) -> `SUPABASE_SERVICE_ROLE_KEY`
5. Paste these into your `.env.local`.

---

## 6. AI API Setup Instructions (Google AI Studio Free Tier)

1. Visit [aistudio.google.com](https://aistudio.google.com/) and create a free API key.
2. Add the key to `.env.local`:
   ```bash
   GEMINI_API_KEY=AIzaSy...
   ```
3. KnowDrive uses:
   - `gemini-3.8-flash` for RAG responses, multi-document reasoning, and structured comparisons.
   - `gemini-embedding-001` (768 dimensions) for text embeddings.

---

## 7. How RAG Works in This Project

```
User Question
    │
    ▼
Generate Query Embedding (gemini-embedding-001, 768 dims)
    │
    ▼
Vector Similarity Search (match_document_chunks RPC via pgvector)
    │ Filter: user_id = auth.uid(), is_trashed = false, file_permissions
    ▼
Retrieve Top-K Chunks with Page Numbers & Snippets
    │
    ▼
Build Grounded System Prompt (with strict anti-hallucination guardrails)
    │
    ▼
Gemini 3.8 Flash Generation
    │
    ▼
Extract Citations -> Link to Document Page Numbers -> Render Clickable Pills
```

### Vector Embedding Architecture (Gemini gemini-embedding-001)
* **Model**: Strictly uses `gemini-embedding-001`.
* **Output Dimensionality**: Configured with `outputDimensionality: 768` matching PostgreSQL `vector(768)`.
* **Zero Fake/Fallback Vectors**: All fallback embedding generation has been removed. If the Gemini API key is missing or the API call fails, the system throws a descriptive error and marks the document job as failed rather than generating simulated vectors.
* **Strict Anti-Hallucination Policy**: The system prompt explicitly commands the model to use **only** provided excerpts:
> *"If the information is not present in the user's documents, state: 'I couldn't find enough information in your stored documents to answer this.' Do not invent facts."*

---

## 8. How File Security Works

* **Multi-Tenant Isolation**: Every database row references `user_id`. Queries strictly filter by `auth.uid() = user_id`.
* **Zero Cross-User Leakage**: User B cannot retrieve User A's files via metadata search, vector similarity search, AI chat, direct ID access, or citations. (Verified by automated unit tests in `tests/auth-security.test.ts`).
* **Private Storage Buckets**: Files in Supabase Storage are private and accessible only via short-lived signed URLs generated on the server.
* **Key Isolation**: `GEMINI_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are only ever accessed on the server. No client-side bundle receives secret keys.

---

## 9. How to Deploy

### Deploy to Vercel (Recommended Free Tier)
1. Push your code to a GitHub repository.
2. In [Vercel](https://vercel.com), click **Add New Project** and import the repository.
3. In **Environment Variables**, add the variables from `.env.example`.
4. Deploy! Next.js App Router and server route handlers will be deployed seamlessly.

---

## 10. Known Free-Tier Limitations

1. **Supabase Free Tier**:
   - 500 MB database size limit (sufficient for ~50,000 document chunks).
   - 1 GB file storage limit.
   - Projects pause after 1 week of inactivity.
2. **Google AI Studio Free Tier**:
   - Rate limit: 15 Requests Per Minute (RPM) on free tier models.
   - 1,500 Requests Per Day (RPD).
   - Rate limiting is handled gracefully with retry notices.
3. **File Size Limit**:
   - Default upload limit is set to 15 MB per file to prevent hitting serverless function body size timeouts.

---

## 11. Future Improvements

* **Document OCR**: Native tesseract or Google Cloud Vision OCR for scanned paper documents and photo receipts.
* **Collaborative Workspaces**: Multi-user shared folders with role-based editing (Viewer/Editor/Admin).
* **Audio & Video Processing**: Multimodal transcript indexing with `gemini-3.5-transcribe` and `gemini-embedding-2`.
* **Hybrid Full-Text + Vector Search (BM25 + pgvector RRF)**: Reciprocal Rank Fusion combining exact keyword matching with semantic vector distance.
* **Exportable Knowledge Graphs**: Visual graph view of interconnected entities across the user's personal drive.
