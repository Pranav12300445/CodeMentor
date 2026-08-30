import {
    Plus,
    Code2
} from "lucide-react";

import type {
    Repository
} from "../types";

import RepositoryItem from "./RepositoryItem";
import ConnectionStatus from "./ConnectionStatus";

interface Props {
    repositories: Repository[];
    selectedRepository: Repository | null;

    onSelectRepository: (
        repository: Repository
    ) => void;

    onUpload: () => void;

    onDelete: (
        repositoryId: string
    ) => void;
}

export default function Sidebar({
    repositories,
    selectedRepository,
    onSelectRepository,
    onUpload,
    onDelete
}: Props) {

    return (
        <aside className="sidebar">

            <div className="sidebar-header">

                <div className="brand">
                    <div className="brand-icon">
                        <Code2 size={22} />
                    </div>

                    <div>
                        <div className="brand-name">
                            CodeMentor
                        </div>

                        <div className="brand-subtitle">
                            AI Code Assistant
                        </div>
                    </div>
                </div>

            </div>


            <div className="repository-header">

                <span>
                    Repositories
                </span>

                <button
                    className="add-button"
                    onClick={onUpload}
                    title="Upload repository"
                >
                    <Plus size={18} />
                </button>

            </div>


            <div className="repository-list">

                {repositories.length === 0 ? (

                    <div className="empty-repositories">
                        No repositories yet.
                    </div>

                ) : (

                    repositories.map(
                        (repository) => (

                            <RepositoryItem
                                key={repository.id}
                                repository={repository}
                                selected={
                                    selectedRepository?.id ===
                                    repository.id
                                }
                                onSelect={
                                    onSelectRepository
                                }
                                onDelete={
                                    onDelete
                                }
                            />

                        )
                    )

                )}

            </div>


            <div className="sidebar-footer">
                <ConnectionStatus />
            </div>

        </aside>
    );
}