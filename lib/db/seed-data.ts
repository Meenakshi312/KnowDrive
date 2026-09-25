import { DriveFile, FolderItem, DocumentRecord, DocumentChunk, Conversation, ChatMessage, UserProfile } from "@/types";

export const DEMO_USER_ID = "00000000-0000-0000-0000-000000000001";

export const DEMO_USER: UserProfile = {
  id: DEMO_USER_ID,
  email: "alex.chen@portfolio.dev",
  full_name: "Alex Chen",
  avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  storage_used: 134217728, // 128 MB
  storage_quota: 1073741824, // 1 GB
  created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  updated_at: new Date().toISOString(),
};

export const SEED_FOLDERS: FolderItem[] = [
  {
    id: "fld-projects",
    user_id: DEMO_USER_ID,
    name: "Engineering Projects",
    color: "blue",
    created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 25 * 86400000).toISOString(),
  },
  {
    id: "fld-career",
    user_id: DEMO_USER_ID,
    name: "Career & Applications",
    color: "emerald",
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
  {
    id: "fld-academic",
    user_id: DEMO_USER_ID,
    name: "Academic Notes & Research",
    color: "purple",
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
];

export const SEED_FILES: DriveFile[] = [
  {
    id: "file-resume",
    user_id: DEMO_USER_ID,
    folder_id: "fld-career",
    name: "Alex_Chen_Resume.pdf",
    original_name: "Alex_Chen_Resume.pdf",
    mime_type: "application/pdf",
    file_type: "pdf",
    size_bytes: 420000,
    storage_path: "demo/Alex_Chen_Resume.pdf",
    processing_status: "ready",
    is_starred: true,
    is_trashed: false,
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    page_count: 2,
    word_count: 650,
  },
  {
    id: "file-job-desc",
    user_id: DEMO_USER_ID,
    folder_id: "fld-career",
    name: "Staff_AI_Engineer_JobDescription.pdf",
    original_name: "Staff_AI_Engineer_JobDescription.pdf",
    mime_type: "application/pdf",
    file_type: "pdf",
    size_bytes: 310000,
    storage_path: "demo/Staff_AI_Engineer_JobDescription.pdf",
    processing_status: "ready",
    is_starred: false,
    is_trashed: false,
    created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    page_count: 3,
    word_count: 1100,
  },
  {
    id: "file-ml-project",
    user_id: DEMO_USER_ID,
    folder_id: "fld-projects",
    name: "ML_Distributed_Inference_Report.pdf",
    original_name: "ML_Distributed_Inference_Report.pdf",
    mime_type: "application/pdf",
    file_type: "pdf",
    size_bytes: 2450000,
    storage_path: "demo/ML_Distributed_Inference_Report.pdf",
    processing_status: "ready",
    is_starred: true,
    is_trashed: false,
    created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 14 * 86400000).toISOString(),
    page_count: 8,
    word_count: 3200,
  },
  {
    id: "file-openfoam",
    user_id: DEMO_USER_ID,
    folder_id: "fld-projects",
    name: "OpenFOAM_CFD_Thermal_Simulation.pdf",
    original_name: "OpenFOAM_CFD_Thermal_Simulation.pdf",
    mime_type: "application/pdf",
    file_type: "pdf",
    size_bytes: 5120000,
    storage_path: "demo/OpenFOAM_CFD_Thermal_Simulation.pdf",
    processing_status: "ready",
    is_starred: false,
    is_trashed: false,
    created_at: new Date(Date.now() - 21 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 21 * 86400000).toISOString(),
    page_count: 12,
    word_count: 4800,
  },
  {
    id: "file-dsa-notes",
    user_id: DEMO_USER_ID,
    folder_id: "fld-academic",
    name: "DSA_Advanced_Graph_Algorithms.md",
    original_name: "DSA_Advanced_Graph_Algorithms.md",
    mime_type: "text/markdown",
    file_type: "md",
    size_bytes: 84000,
    storage_path: "demo/DSA_Advanced_Graph_Algorithms.md",
    processing_status: "ready",
    is_starred: false,
    is_trashed: false,
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    page_count: 4,
    word_count: 1850,
  },
  {
    id: "file-cloud-storage",
    user_id: DEMO_USER_ID,
    folder_id: "fld-projects",
    name: "CloudStorage_Architecture_Report.pdf",
    original_name: "CloudStorage_Architecture_Report.pdf",
    mime_type: "application/pdf",
    file_type: "pdf",
    size_bytes: 1820000,
    storage_path: "demo/CloudStorage_Architecture_Report.pdf",
    processing_status: "ready",
    is_starred: true,
    is_trashed: false,
    created_at: new Date(Date.now() - 18 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 18 * 86400000).toISOString(),
    page_count: 10,
    word_count: 3600,
  },
];

export const SEED_DOCUMENTS: DocumentRecord[] = [
  {
    id: "doc-resume",
    file_id: "file-resume",
    user_id: DEMO_USER_ID,
    title: "Alex Chen - Full-Stack & Machine Learning Software Engineer",
    page_count: 2,
    word_count: 650,
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
  {
    id: "doc-job-desc",
    file_id: "file-job-desc",
    user_id: DEMO_USER_ID,
    title: "Staff AI Engineer - Multi-Tenant Knowledge Platforms",
    page_count: 3,
    word_count: 1100,
    created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
  {
    id: "doc-ml-project",
    file_id: "file-ml-project",
    user_id: DEMO_USER_ID,
    title: "Distributed LLM Inference and Low-Latency Serving Pipeline",
    page_count: 8,
    word_count: 3200,
    created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
  },
  {
    id: "doc-openfoam",
    file_id: "file-openfoam",
    user_id: DEMO_USER_ID,
    title: "Computational Fluid Dynamics Simulation of Conjugate Heat Transfer using OpenFOAM",
    page_count: 12,
    word_count: 4800,
    created_at: new Date(Date.now() - 21 * 86400000).toISOString(),
  },
  {
    id: "doc-dsa-notes",
    file_id: "file-dsa-notes",
    user_id: DEMO_USER_ID,
    title: "Advanced Graph Algorithms & Memory Optimization",
    page_count: 4,
    word_count: 1850,
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: "doc-cloud-storage",
    file_id: "file-cloud-storage",
    user_id: DEMO_USER_ID,
    title: "Cloud Storage Platform with PostgreSQL Partitioning and pgvector Search",
    page_count: 10,
    word_count: 3600,
    created_at: new Date(Date.now() - 18 * 86400000).toISOString(),
  },
];

// Seed Document Chunks with high-value factual content for RAG queries
export const SEED_CHUNKS: DocumentChunk[] = [
  // Resume Chunks
  {
    id: "chk-resume-1",
    document_id: "doc-resume",
    file_id: "file-resume",
    user_id: DEMO_USER_ID,
    chunk_index: 0,
    page_number: 1,
    token_count: 220,
    file_name: "Alex_Chen_Resume.pdf",
    chunk_text: "Alex Chen - Senior Full-Stack & Systems Engineer. Email: alex.chen@portfolio.dev. Summary: 5+ years designing resilient distributed systems, modern web platforms, and production vector search architectures. Core skills: TypeScript, React, Next.js, Python, PostgreSQL, REST & GraphQL APIs, Docker, Tailwind CSS, Redis caching.",
  },
  {
    id: "chk-resume-2",
    document_id: "doc-resume",
    file_id: "file-resume",
    user_id: DEMO_USER_ID,
    chunk_index: 1,
    page_number: 2,
    token_count: 240,
    file_name: "Alex_Chen_Resume.pdf",
    chunk_text: "Experience Highlights: Senior Platform Engineer at NexusTech. Led migration to Next.js App Router and PostgreSQL connection pooling. Integrated enterprise search using pgvector. Note: Currently developing production expertise in Kubernetes cluster orchestration and CUDA kernel optimization for large-scale GPU clusters.",
  },

  // Job Description Chunks
  {
    id: "chk-job-1",
    document_id: "doc-job-desc",
    file_id: "file-job-desc",
    user_id: DEMO_USER_ID,
    chunk_index: 0,
    page_number: 1,
    token_count: 280,
    file_name: "Staff_AI_Engineer_JobDescription.pdf",
    chunk_text: "Job Title: Staff AI Engineer - Knowledge Systems. Responsibilities: Architect enterprise retrieval-augmented generation (RAG) platforms operating across millions of unstructured documents. Required Qualifications: 5+ years experience in TypeScript/Python, hands-on production experience with PostgreSQL, pgvector, and relational schema optimization.",
  },
  {
    id: "chk-job-2",
    document_id: "doc-job-desc",
    file_id: "file-job-desc",
    user_id: DEMO_USER_ID,
    chunk_index: 1,
    page_number: 2,
    token_count: 260,
    file_name: "Staff_AI_Engineer_JobDescription.pdf",
    chunk_text: "Required Technical Proficiencies: Deep understanding of vector embeddings, HNSW indexing, chunking strategies with token overlap, and cross-document reasoning. Must have demonstrated expertise in Docker containerization and CI/CD pipelines. Nice to have: Experience with CFD simulation or scientific high-performance computing (HPC).",
  },

  // OpenFOAM Project Chunks
  {
    id: "chk-openfoam-1",
    document_id: "doc-openfoam",
    file_id: "file-openfoam",
    user_id: DEMO_USER_ID,
    chunk_index: 0,
    page_number: 1,
    token_count: 310,
    file_name: "OpenFOAM_CFD_Thermal_Simulation.pdf",
    chunk_text: "Title: Computational Fluid Dynamics Simulation of Conjugate Heat Transfer. Introduction: This research investigated conjugate heat transfer and natural convection in high-efficiency thermal insulation enclosures using OpenFOAM 10. The goal was modeling transient heat dissipation under turbulent boundary conditions.",
  },
  {
    id: "chk-openfoam-2",
    document_id: "doc-openfoam",
    file_id: "file-openfoam",
    user_id: DEMO_USER_ID,
    chunk_index: 1,
    page_number: 4,
    token_count: 320,
    file_name: "OpenFOAM_CFD_Thermal_Simulation.pdf",
    chunk_text: "Methodology and Solver Setup: We utilized the buoyantBoussinesqSimpleFoam solver for steady-state incompressible turbulent heat transfer. Mesh discretization was conducted with snappyHexMesh, producing 1.8M polyhedral cells with y+ values maintained below 1 along heated solid walls. Thermal boundary conditions were calibrated using experimental infrared thermography.",
  },
  {
    id: "chk-openfoam-3",
    document_id: "doc-openfoam",
    file_id: "file-openfoam",
    user_id: DEMO_USER_ID,
    chunk_index: 2,
    page_number: 9,
    token_count: 290,
    file_name: "OpenFOAM_CFD_Thermal_Simulation.pdf",
    chunk_text: "Results and Validation: OpenFOAM CFD simulations showed a 28% reduction in thermal bridging across aluminum support flanges when aerogel vacuum breaks were introduced. Velocity streamline contours revealed localized recirculation vortices dampening convective heat flux by 4.2 W/m2.",
  },

  // ML Project Chunks
  {
    id: "chk-ml-1",
    document_id: "doc-ml-project",
    file_id: "file-ml-project",
    user_id: DEMO_USER_ID,
    chunk_index: 0,
    page_number: 2,
    token_count: 280,
    file_name: "ML_Distributed_Inference_Report.pdf",
    chunk_text: "System Architecture: Built a high-throughput, low-latency LLM serving engine. Implemented dynamic batching and continuous paged attention to achieve 4x throughput improvements on multi-tenant workloads. Evaluated model quantization (INT8 and FP4) across transformer layers without perceptual loss in reasoning quality.",
  },
  {
    id: "chk-ml-2",
    document_id: "doc-ml-project",
    file_id: "file-ml-project",
    user_id: DEMO_USER_ID,
    chunk_index: 1,
    page_number: 6,
    token_count: 300,
    file_name: "ML_Distributed_Inference_Report.pdf",
    chunk_text: "Deployment and Orchestration: Packaged the entire inference microservice using Docker multi-stage builds, reducing image size from 8.2GB to 1.9GB. Containerized health checks and Prometheus metric collectors monitor token latency P99 (target < 35ms per token). Orchestrated on AWS GPU instances with automated failover.",
  },

  // Cloud Storage Project Chunks (PostgreSQL + pgvector evidence)
  {
    id: "chk-cloud-1",
    document_id: "doc-cloud-storage",
    file_id: "file-cloud-storage",
    user_id: DEMO_USER_ID,
    chunk_index: 0,
    page_number: 3,
    token_count: 310,
    file_name: "CloudStorage_Architecture_Report.pdf",
    chunk_text: "PostgreSQL Database Layer: Architected a multi-tenant relational schema on PostgreSQL with table partitioning across user workspaces. Enforced strict Row Level Security (RLS) policies guaranteeing cryptographic isolation between concurrent tenant requests. Benchmarked index queries at under 4ms latency for 500,000 document records.",
  },
  {
    id: "chk-cloud-2",
    document_id: "doc-cloud-storage",
    file_id: "file-cloud-storage",
    user_id: DEMO_USER_ID,
    chunk_index: 1,
    page_number: 8,
    token_count: 320,
    file_name: "CloudStorage_Architecture_Report.pdf",
    chunk_text: "Vector Retrieval with pgvector: Integrated pgvector extension using HNSW (Hierarchical Navigable Small World) index with cosine distance metric. Tuned m=16 and ef_construction=64 parameters, achieving 98.4% recall at 12ms query execution. Document chunks are stored with 768-dimensional normalized embeddings.",
  },

  // DSA Notes Chunks
  {
    id: "chk-dsa-1",
    document_id: "doc-dsa-notes",
    file_id: "file-dsa-notes",
    user_id: DEMO_USER_ID,
    chunk_index: 0,
    page_number: 1,
    token_count: 240,
    file_name: "DSA_Advanced_Graph_Algorithms.md",
    chunk_text: "Advanced Graph Notes: Tarjan's Strongly Connected Components (SCC) and Topological Ordering. Detailed complexity analysis for Directed Acyclic Graphs (DAGs). Applications include build dependency graphs and document semantic hierarchy trees.",
  },
];

export const SEED_CONVERSATIONS: Conversation[] = [
  {
    id: "conv-sample-1",
    user_id: DEMO_USER_ID,
    title: "Skills match with Staff AI Job Description",
    scope: "all_drive",
    target_file_ids: ["file-resume", "file-job-desc", "file-cloud-storage", "file-ml-project"],
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    last_message: "Here is the breakdown of your project evidence against the job requirements...",
  },
  {
    id: "conv-sample-2",
    user_id: DEMO_USER_ID,
    title: "OpenFOAM Thermal Simulation summary",
    scope: "file",
    target_file_ids: ["file-openfoam"],
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    last_message: "In your OpenFOAM project, you evaluated conjugate heat transfer...",
  },
];

export const SEED_MESSAGES: ChatMessage[] = [
  {
    id: "msg-1",
    conversation_id: "conv-sample-1",
    user_id: DEMO_USER_ID,
    role: "user",
    content: "Which projects in my Drive demonstrate the skills required by this Staff AI Engineer job description?",
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: "msg-2",
    conversation_id: "conv-sample-1",
    user_id: DEMO_USER_ID,
    role: "assistant",
    content: `Based on an analysis across your stored documents, here is the synthesis comparing your project evidence against the **Staff AI Engineer** requirements:

### 1. PostgreSQL & Schema Design (Required)
* **Status**: Fully Demonstrated
* **Project Evidence**: In your **Cloud Storage Platform**, you architected a multi-tenant relational schema on PostgreSQL with table partitioning and verified under 4ms query latency.
* **Citations**: [CloudStorage_Architecture_Report.pdf — Page 3], [Alex_Chen_Resume.pdf — Page 1]

### 2. pgvector & Vector Search (Required)
* **Status**: Fully Demonstrated
* **Project Evidence**: Your **Cloud Storage Architecture Report** details implementing pgvector with HNSW index (m=16, ef_construction=64) achieving 98.4% recall and 12ms query execution.
* **Citations**: [CloudStorage_Architecture_Report.pdf — Page 8]

### 3. Docker Containerization & Microservices (Required)
* **Status**: Fully Demonstrated
* **Project Evidence**: In your **ML Distributed Inference Report**, you packaged inference microservices with multi-stage Docker builds (shrinking images from 8.2GB to 1.9GB) and integrated Prometheus metrics.
* **Citations**: [ML_Distributed_Inference_Report.pdf — Page 6]

### 4. Scientific Simulation & HPC (Preferred Bonus)
* **Status**: Highly Unique Match
* **Project Evidence**: Your **OpenFOAM CFD Thermal Simulation** utilized buoyantBoussinesqSimpleFoam and snappyHexMesh with 1.8M polyhedral cells for turbulent conjugate heat transfer.
* **Citations**: [OpenFOAM_CFD_Thermal_Simulation.pdf — Page 4]`,
    created_at: new Date(Date.now() - 2 * 86400000 + 3000).toISOString(),
    citations: [
      {
        id: "cit-1",
        message_id: "msg-2",
        file_id: "file-cloud-storage",
        file_name: "CloudStorage_Architecture_Report.pdf",
        page_number: 3,
        snippet: "Architected a multi-tenant relational schema on PostgreSQL with table partitioning across user workspaces. Enforced strict Row Level Security (RLS) policies...",
      },
      {
        id: "cit-2",
        message_id: "msg-2",
        file_id: "file-cloud-storage",
        file_name: "CloudStorage_Architecture_Report.pdf",
        page_number: 8,
        snippet: "Integrated pgvector extension using HNSW (Hierarchical Navigable Small World) index with cosine distance metric. Tuned m=16 and ef_construction=64 parameters...",
      },
      {
        id: "cit-3",
        message_id: "msg-2",
        file_id: "file-ml-project",
        file_name: "ML_Distributed_Inference_Report.pdf",
        page_number: 6,
        snippet: "Packaged the entire inference microservice using Docker multi-stage builds, reducing image size from 8.2GB to 1.9GB. Containerized health checks...",
      },
      {
        id: "cit-4",
        message_id: "msg-2",
        file_id: "file-openfoam",
        file_name: "OpenFOAM_CFD_Thermal_Simulation.pdf",
        page_number: 4,
        snippet: "Utilized the buoyantBoussinesqSimpleFoam solver for steady-state incompressible turbulent heat transfer. Mesh discretization was conducted with snappyHexMesh...",
      },
    ],
  },
];
