import {
    Trash2,
    FolderGit2
} from "lucide-react";

import type {
    Repository
} from "../types";

interface Props {
    repository: Repository;
    selected: boolean;
    onSelect: (
        repository: Repository
    ) => void;
    onDelete: (
        repositoryId: string
    ) => void;
}

export default function RepositoryItem({
    repository,
    selected,
    onSelect,
    onDelete
}: Props) {

    return (
        <div
            className={`repository-item ${
                selected
                    ? "selected"
                    : ""
            }`}
            onClick={() =>
                onSelect(repository)
            }
        >

            <div className="repository-icon">
                <FolderGit2 size={18} />
            </div>

            <div className="repository-info">

                <div className="repository-name">
                    {repository.name}
                </div>

                <div className="repository-meta">
                    {repository.total_chunks} chunks
                    {" • "}
                    {repository.status}
                </div>

            </div>

            <button
                className="delete-button"
                title="Delete repository"
                onClick={(event) => {

                    event.stopPropagation();

                    onDelete(
                        repository.id
                    );

                }}
            >
                <Trash2 size={16} />
            </button>

        </div>
    );
}