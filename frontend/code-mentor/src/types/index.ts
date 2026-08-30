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
    chunk_type: string;
    language: string;
    content: string;
    score?: number;
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
    file_path: string;
    chunk_type: string;
    language: string;
    content: string;
    score: number;
}

export interface SearchResponse {
    repository_id: string;
    query: string;
    count: number;
    results: SearchResult[];
}