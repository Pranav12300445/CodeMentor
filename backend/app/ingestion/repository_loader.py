from pathlib import Path
import zipfile
import uuid


# CodeMentor project root
PROJECT_ROOT = Path(__file__).resolve().parents[3]

UPLOAD_DIR = PROJECT_ROOT / "data" / "uploads"
REPOSITORY_DIR = PROJECT_ROOT / "data" / "repositories"


def save_and_extract_repository(file_content: bytes, filename: str):

    repository_id = str(uuid.uuid4())

    upload_dir = UPLOAD_DIR / repository_id
    repository_dir = REPOSITORY_DIR / repository_id

    upload_dir.mkdir(parents=True, exist_ok=True)
    repository_dir.mkdir(parents=True, exist_ok=True)

    zip_path = upload_dir / filename

    with open(zip_path, "wb") as file:
        file.write(file_content)

    with zipfile.ZipFile(zip_path, "r") as zip_file:
        zip_file.extractall(repository_dir)

    return {
        "repository_id": repository_id,
        "repository_path": str(repository_dir)
    }