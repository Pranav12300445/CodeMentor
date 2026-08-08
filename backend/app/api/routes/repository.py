from fastapi import APIRouter, UploadFile, File, HTTPException

from app.ingestion.repository_loader import (
    save_and_extract_repository
)

from app.ingestion.file_scanner import (
    scan_repository
)

from app.ingestion.language_detector import (
    detect_language
)


router = APIRouter(
    prefix="/api/repository",
    tags=["Repository"]
)


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

    repository = save_and_extract_repository(
        file_content,
        file.filename
    )

    files = scan_repository(
        repository["repository_path"]
    )

    file_information = []

    for file_path in files:

        language = detect_language(file_path)

        file_information.append({
            "file": file_path,
            "language": language
        })

    return {
        "message": "Repository uploaded successfully",
        "repository_id": repository["repository_id"],
        "total_files": len(file_information),
        "files": file_information
    }