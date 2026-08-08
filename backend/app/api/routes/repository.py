from fastapi import APIRouter, UploadFile, File, HTTPException

from app.ingestion.repository_loader import (
    save_and_extract_repository
)

from app.ingestion.repository_processor import (
    RepositoryProcessor
)


router = APIRouter(
    prefix="/api/repository",
    tags=["Repository"]
)


processor = RepositoryProcessor()


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

    try:

        repository = save_and_extract_repository(
            file_content,
            file.filename
        )

        result = processor.process_repository(
            repository_path=repository["repository_path"],
            repository_id=repository["repository_id"]
        )

        return {
            "message": "Repository processed successfully",
            **result
        }

    except Exception as exc:

        raise HTTPException(
            status_code=500,
            detail=f"Repository processing failed: {exc}"
        )