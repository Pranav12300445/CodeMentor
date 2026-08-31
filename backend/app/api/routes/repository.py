import os
from pathlib import Path

from fastapi import APIRouter, UploadFile, File, HTTPException

from app.ingestion.repository_loader import (
    save_and_extract_repository
)

from app.ingestion.repository_processor import (
    RepositoryProcessor
)

from app.services.repository_service import (
    RepositoryService
)


router = APIRouter(
    prefix="/api/repository",
    tags=["Repository"]
)


processor = RepositoryProcessor()

repository_service = RepositoryService()


@router.post("/upload")
async def upload_repository(
    file: UploadFile = File(...)
):

    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="No file provided"
        )

    if not file.filename.lower().endswith(".zip"):
        raise HTTPException(
            status_code=400,
            detail="Only ZIP files are currently supported"
        )

    file_content = await file.read()

    if not file_content:
        raise HTTPException(
            status_code=400,
            detail="Uploaded file is empty"
        )

    repository = None

    try:

        # --------------------------------------------------
        # Save and extract repository
        # --------------------------------------------------

        repository = save_and_extract_repository(
            file_content,
            file.filename
        )

        repository_id = repository[
            "repository_id"
        ]

        repository_path = repository[
            "repository_path"
        ]

        # --------------------------------------------------
        # Create repository metadata
        # --------------------------------------------------

        repository_service.create(
            repository_id=repository_id,
            name=repository.get(
                "repository_name",
                file.filename.rsplit(".", 1)[0]
            ),
            original_filename=file.filename,
            path=repository_path
        )

        # --------------------------------------------------
        # Process repository
        # --------------------------------------------------

        result = processor.process_repository(
            repository_path=repository_path,
            repository_id=repository_id
        )

        # --------------------------------------------------
        # Update repository status
        # --------------------------------------------------

        repository_service.update_status(
            repository_id=repository_id,
            status="indexed",
            total_files=result.get(
                "total_files",
                0
            ),
            processed_files=result.get(
                "processed_files",
                0
            ),
            skipped_files=result.get(
                "skipped_files",
                0
            ),
            total_chunks=result.get(
                "total_chunks",
                0
            )
        )

        # --------------------------------------------------
        # Return existing processing response
        # --------------------------------------------------

        return {
            "message": "Repository processed successfully",
            **result
        }

    except Exception as exc:

        import traceback

        traceback.print_exc()

        # --------------------------------------------------
        # Mark repository as failed
        # --------------------------------------------------

        if repository:

            try:

                repository_service.update_status(
                    repository_id=repository[
                        "repository_id"
                    ],
                    status="failed"
                )

            except Exception:

                traceback.print_exc()

        raise HTTPException(
            status_code=500,
            detail=(
                "Repository processing failed: "
                f"{type(exc).__name__}: {exc}"
            )
        )


# ==========================================================
# Repository Management
# ==========================================================

@router.get("/")
def list_repositories():

    return {
        "repositories": repository_service.list_all()
    }


@router.get("/{repository_id}")
def get_repository(
    repository_id: str
):

    repository = repository_service.get(
        repository_id
    )

    if repository is None:

        raise HTTPException(
            status_code=404,
            detail="Repository not found"
        )

    return repository


@router.delete("/")
def delete_all_repositories():

    result = repository_service.delete_all()

    if result["errors"]:

        raise HTTPException(
            status_code=500,
            detail={
                "message": (
                    "Some errors occurred "
                    "during deletion"
                ),
                "deleted_repositories": result[
                    "deleted_repositories"
                ],
                "errors": result["errors"]
            }
        )

    return {
        "message": "All data deleted",
        "deleted_repositories": result[
            "deleted_repositories"
        ]
    }


@router.delete("/{repository_id}")
def delete_repository(
    repository_id: str
):

    deleted = repository_service.delete(
        repository_id
    )

    if not deleted:

        raise HTTPException(
            status_code=404,
            detail="Repository not found"
        )

    return {
        "message": "Repository deleted",
        "repository_id": repository_id
    }


# ==========================================================
# File Explorer
# ==========================================================

@router.get("/{repository_id}/files")
def get_file_tree(
    repository_id: str
):
    """
    Return the file tree for a repository as a
    nested JSON structure.
    """

    repository = repository_service.get(
        repository_id
    )

    if repository is None:

        raise HTTPException(
            status_code=404,
            detail="Repository not found"
        )

    repository_path = repository["path"]

    if not os.path.isdir(repository_path):

        raise HTTPException(
            status_code=404,
            detail="Repository files not found on disk"
        )

    from app.ingestion.file_scanner import (
        scan_repository
    )

    flat_files = scan_repository(repository_path)

    tree = _build_tree(flat_files)

    return {
        "repository_id": repository_id,
        "tree": tree
    }


@router.get("/{repository_id}/files/{file_path:path}")
def get_file_content(
    repository_id: str,
    file_path: str
):
    """
    Return the content of a single file from a repository.
    """

    repository = repository_service.get(
        repository_id
    )

    if repository is None:

        raise HTTPException(
            status_code=404,
            detail="Repository not found"
        )

    repository_path = Path(repository["path"])

    # Path traversal protection
    resolved = (
        repository_path / file_path
    ).resolve()

    if not str(resolved).startswith(
        str(repository_path.resolve())
    ):

        raise HTTPException(
            status_code=400,
            detail="Invalid file path"
        )

    if not resolved.is_file():

        raise HTTPException(
            status_code=404,
            detail="File not found"
        )

    from app.ingestion.file_scanner import (
        BINARY_EXTENSIONS
    )

    extension = resolved.suffix.lower()

    if extension in BINARY_EXTENSIONS:

        raise HTTPException(
            status_code=400,
            detail="Binary files cannot be displayed"
        )

    from app.ingestion.language_detector import (
        detect_language
    )

    try:

        content = resolved.read_text(
            encoding="utf-8",
            errors="replace"
        )

    except Exception as exc:

        raise HTTPException(
            status_code=500,
            detail=f"Failed to read file: {exc}"
        )

    return {
        "file_path": file_path,
        "language": detect_language(resolved.name),
        "content": content,
        "size": resolved.stat().st_size
    }


# ==========================================================
# Helpers
# ==========================================================

def _build_tree(
    file_paths: list[str]
) -> list[dict]:
    """
    Convert a flat list of relative file paths into
    a nested tree structure suitable for JSON output.
    """

    root: dict = {}

    for file_path in file_paths:

        parts = file_path.replace("\\", "/").split("/")

        current = root

        for part in parts[:-1]:

            if part not in current:
                current[part] = {}

            current = current[part]

        # Mark file with None
        current[parts[-1]] = None

    def to_list(node: dict) -> list[dict]:

        items = []

        for name, children in sorted(
            node.items(),
            key=lambda item: (
                item[1] is None,
                item[0].lower()
            )
        ):

            if children is None:

                items.append({
                    "name": name,
                    "type": "file",
                    "path": name
                })

            else:

                child_list = to_list(children)

                items.append({
                    "name": name,
                    "type": "directory",
                    "children": child_list
                })

        return items

    result = to_list(root)

    # Attach full paths
    def attach_paths(
        nodes: list[dict],
        prefix: str = ""
    ):

        for node in nodes:

            full_path = (
                f"{prefix}/{node['name']}"
                if prefix
                else node["name"]
            )

            node["path"] = full_path

            if node["type"] == "directory":
                attach_paths(
                    node["children"],
                    full_path
                )

    attach_paths(result)

    return result