export interface Repository {
    id: string;
    name: string;
    original_filename: string;
    path: string;
    status: string;
    total_files: number;
    processed_files: number;
    skipped_files: number;
    total_chunks: number;
    created_at: string;
    updated_at: string;
}

export interface RepositoryListResponse {
    repositories: Repository[];
}


// Chat

export interface ChatMessage {
    id: string;
    role: "user" | "assistant";
    content: string;
    sources?: ChatSource[];
    sourceCount?: number;
    timestamp: Date;
}

export interface ChatSource {
    file_path: string;
    language: string;
    node_type: string;
    name: string;
    parent?: string;
    start_line: number;
    end_line: number;
    score?: number;
    code: string;
}

export interface ChatResponse {
    answer: string;
    repository_id: string;
    question: string;
    sources: ChatSource[];
    source_count: number;
}


// Search

export interface SearchResult {
    score: number;
    repository_id: string;
    language: string;
    file_path: string;
    node_type: string;
    name: string;
    parent?: string;
    start_line: number;
    end_line: number;
    code: string;
    // Hybrid search additional fields
    semantic_score?: number;
    keyword_score?: number;
    hybrid_score?: number;
}

export interface SearchResponse {
    repository_id: string;
    query: string;
    count: number;
    results: SearchResult[];
}


// File Explorer

export interface FileTreeNode {
    name: string;
    type: "file" | "directory";
    path: string;
    children?: FileTreeNode[];
}

export interface FileContentResponse {
    file_path: string;
    language: string;
    content: string;
    size: number;
}