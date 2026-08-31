import axios from "axios";

import type {
    ChatResponse,
    SearchResponse,
    FileTreeNode,
    FileContentResponse,
} from "../types";

const api = axios.create({
    baseURL: "",
});

// ─── Repository ───

export const getRepositories = async () => {
    const response = await api.get(
        "/api/repository/"
    );

    return response.data;
};

export const getRepository = async (
    repositoryId: string
) => {
    const response = await api.get(
        `/api/repository/${repositoryId}`
    );

    return response.data;
};

export const uploadRepository = async (
    file: File
) => {

    const formData = new FormData();

    formData.append(
        "file",
        file
    );

    const response = await api.post(
        "/api/repository/upload",
        formData
    );

    return response.data;
};

export const deleteRepository = async (
    repositoryId: string
) => {

    const response = await api.delete(
        `/api/repository/${repositoryId}`
    );

    return response.data;
};


// ─── Chat ───

export const sendChatMessage = async (
    repositoryId: string,
    message: string,
    topK: number = 5
): Promise<ChatResponse> => {

    const response = await api.post(
        "/api/chat/",
        {
            repository_id: repositoryId,
            message,
            top_k: topK,
        }
    );

    return response.data;
};


// ─── Search ───

export const searchCode = async (
    repositoryId: string,
    query: string,
    topK: number = 5,
    mode: "semantic" | "hybrid" = "hybrid"
): Promise<SearchResponse> => {

    const response = await api.post(
        `/api/search/${mode}`,
        {
            repository_id: repositoryId,
            query,
            top_k: topK,
        }
    );

    return response.data;
};


// ─── File Explorer ───

export const getFileTree = async (
    repositoryId: string
): Promise<{ repository_id: string; tree: FileTreeNode[] }> => {

    const response = await api.get(
        `/api/repository/${repositoryId}/files`
    );

    return response.data;
};

export const getFileContent = async (
    repositoryId: string,
    filePath: string
): Promise<FileContentResponse> => {

    const response = await api.get(
        `/api/repository/${repositoryId}/files/${filePath}`
    );

    return response.data;
};


// ─── Health ───

export const healthCheck = async (): Promise<boolean> => {

    try {

        const response = await api.get(
            "/health",
            { timeout: 5000 }
        );

        return response.data?.status === "healthy";

    } catch {

        return false;

    }
};

export default api;