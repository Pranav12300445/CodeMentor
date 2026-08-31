import {
    useEffect,
    useState,
    useCallback
} from "react";

import Sidebar from "./components/Sidebar";
import UploadModal from "./components/UploadModal";
import Loading from "./components/Loading";
import ChatPanel from "./components/ChatPanel";
import SearchPanel from "./components/SearchPanel";
import CodeExplorer from "./components/CodeExplorer";

import type {
    Repository
} from "./types";

import {
    getRepositories,
    uploadRepository,
    deleteRepository
} from "./services/api";

import {
    LayoutDashboard,
    FolderCode,
    MessageSquare,
    Search
} from "lucide-react";


type Tab = "dashboard" | "explorer" | "chat" | "search";


export default function App() {

    const [
        repositories,
        setRepositories
    ] = useState<Repository[]>([]);

    const [
        selectedRepository,
        setSelectedRepository
    ] = useState<Repository | null>(null);

    const [
        initialLoading,
        setInitialLoading
    ] = useState(true);

    const [
        uploadOpen,
        setUploadOpen
    ] = useState(false);

    const [
        activeTab,
        setActiveTab
    ] = useState<Tab>("dashboard");

    const [
        deleteError,
        setDeleteError
    ] = useState<string | null>(null);


    const loadRepositories = useCallback(
        async (isInitial: boolean = false) => {

            try {

                if (isInitial) {
                    setInitialLoading(true);
                }

                const data =
                    await getRepositories();

                setRepositories(
                    data.repositories
                );

            } catch (error) {

                console.error(
                    "Failed to load repositories:",
                    error
                );

            } finally {

                if (isInitial) {
                    setInitialLoading(false);
                }

            }
        },
        []
    );


    useEffect(() => {

        loadRepositories(true);

    }, [loadRepositories]);


    useEffect(() => {

        setActiveTab("dashboard");

    }, [selectedRepository?.id]);


    const handleUpload = async (
        file: File
    ) => {

        await uploadRepository(file);

        await loadRepositories();
    };


    const handleDelete = async (
        repositoryId: string
    ) => {

        const confirmed =
            window.confirm(
                "Delete this repository and all indexed data?"
            );

        if (!confirmed) {
            return;
        }

        setDeleteError(null);

        try {

            await deleteRepository(
                repositoryId
            );

            if (
                selectedRepository?.id ===
                repositoryId
            ) {
                setSelectedRepository(null);
            }

            await loadRepositories();

        } catch (error) {

            console.error(
                "Delete failed:",
                error
            );

            setDeleteError(
                "Failed to delete repository. Please try again."
            );

            setTimeout(() => {
                setDeleteError(null);
            }, 4000);

        }
    };


    if (initialLoading) {

        return (
            <div className="app-loading">
                <Loading />
            </div>
        );

    }


    const renderTabContent = () => {

        if (!selectedRepository) {

            return (
                <div className="welcome-card">

                    <div className="welcome-icon">
                        💻
                    </div>

                    <h2>
                        Welcome to CodeMentor
                    </h2>

                    <p>
                        Upload a repository and
                        start exploring your
                        codebase with AI.
                    </p>

                    <button
                        className="primary-button"
                        onClick={() =>
                            setUploadOpen(true)
                        }
                    >
                        <UploadIcon />
                        Upload Repository
                    </button>

                </div>
            );
        }

        switch (activeTab) {

            case "chat":
                return (
                    <ChatPanel
                        repository={
                            selectedRepository
                        }
                    />
                );

            case "explorer":
                return (
                    <CodeExplorer
                        repository={
                            selectedRepository
                        }
                    />
                );

            case "search":
                return (
                    <SearchPanel
                        repository={
                            selectedRepository
                        }
                    />
                );

            case "dashboard":
            default:
                return (
                    <div className="repository-dashboard">

                        <div className="stats-grid">

                            <div className="stat-card">
                                <span>
                                    Files
                                </span>

                                <strong>
                                    {
                                        selectedRepository
                                            .total_files
                                    }
                                </strong>
                            </div>


                            <div className="stat-card">
                                <span>
                                    Processed
                                </span>

                                <strong>
                                    {
                                        selectedRepository
                                            .processed_files
                                    }
                                </strong>
                            </div>


                            <div className="stat-card">
                                <span>
                                    Skipped
                                </span>

                                <strong>
                                    {
                                        selectedRepository
                                            .skipped_files
                                    }
                                </strong>
                            </div>


                            <div className="stat-card">
                                <span>
                                    Code Chunks
                                </span>

                                <strong>
                                    {
                                        selectedRepository
                                            .total_chunks
                                    }
                                </strong>
                            </div>

                        </div>


                        <div className="repository-details">

                            <h2>
                                Repository Details
                            </h2>

                            <div className="detail-row">
                                <span>
                                    Status
                                </span>

                                <span className={`status-badge ${selectedRepository.status}`}>
                                    ●{" "}
                                    {
                                        selectedRepository.status
                                    }
                                </span>
                            </div>

                            <div className="detail-row">
                                <span>
                                    Original file
                                </span>

                                <span>
                                    {
                                        selectedRepository
                                            .original_filename
                                    }
                                </span>
                            </div>

                            <div className="detail-row">
                                <span>
                                    Created
                                </span>

                                <span>
                                    {
                                        selectedRepository.created_at
                                            ? new Date(
                                                selectedRepository.created_at
                                            ).toLocaleString()
                                            : "—"
                                    }
                                </span>
                            </div>

                        </div>

                    </div>
                );
        }
    };


    return (
        <div className="app">

            <Sidebar
                repositories={repositories}
                selectedRepository={
                    selectedRepository
                }
                onSelectRepository={
                    setSelectedRepository
                }
                onUpload={() =>
                    setUploadOpen(true)
                }
                onDelete={
                    handleDelete
                }
            />


            <main className="main-content">

                <header className="topbar">

                    <div className="topbar-info">
                        <h1>
                            {selectedRepository
                                ? selectedRepository.name
                                : "CodeMentor AI"}
                        </h1>

                        <p>
                            {selectedRepository
                                ? "Repository overview"
                                : "AI-powered codebase assistant"}
                        </p>
                    </div>

                    {selectedRepository && (

                        <nav className="tab-nav">

                            <button
                                className={`tab-button ${
                                    activeTab === "dashboard"
                                        ? "active"
                                        : ""
                                }`}
                                onClick={() =>
                                    setActiveTab(
                                        "dashboard"
                                    )
                                }
                            >
                                <LayoutDashboard
                                    size={16}
                                />
                                Dashboard
                            </button>

                            <button
                                className={`tab-button ${
                                    activeTab === "explorer"
                                        ? "active"
                                        : ""
                                }`}
                                onClick={() =>
                                    setActiveTab(
                                        "explorer"
                                    )
                                }
                            >
                                <FolderCode
                                    size={16}
                                />
                                Explorer
                            </button>

                            <button
                                className={`tab-button ${
                                    activeTab === "chat"
                                        ? "active"
                                        : ""
                                }`}
                                onClick={() =>
                                    setActiveTab(
                                        "chat"
                                    )
                                }
                            >
                                <MessageSquare
                                    size={16}
                                />
                                Chat
                            </button>

                            <button
                                className={`tab-button ${
                                    activeTab === "search"
                                        ? "active"
                                        : ""
                                }`}
                                onClick={() =>
                                    setActiveTab(
                                        "search"
                                    )
                                }
                            >
                                <Search
                                    size={16}
                                />
                                Search
                            </button>

                        </nav>

                    )}

                </header>


                {deleteError && (
                    <div className="inline-error">
                        {deleteError}
                    </div>
                )}


                <section className={
                    activeTab === "chat" || activeTab === "search" || activeTab === "explorer"
                        ? "dashboard no-padding"
                        : "dashboard"
                }>
                    {renderTabContent()}
                </section>

            </main>


            <UploadModal
                open={uploadOpen}
                onClose={() =>
                    setUploadOpen(false)
                }
                onUpload={
                    handleUpload
                }
            />

        </div>
    );
}


function UploadIcon() {

    return (
        <span style={{
            marginRight: "8px"
        }}>
            ↑
        </span>
    );
}