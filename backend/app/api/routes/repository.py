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