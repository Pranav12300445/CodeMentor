import os
import zipfile
import uuid


UPLOAD_DIR = "data/uploads"
REPOSITORY_DIR = "data/repositories"


def save_and_extract_repository(file_content: bytes, filename: str):
    repository_id = str(uuid.uuid4())

    upload_dir = os.path.join(UPLOAD_DIR, repository_id)
    repository_dir = os.path.join(REPOSITORY_DIR, repository_id)

    os.makedirs(upload_dir, exist_ok=True)
    os.makedirs(repository_dir, exist_ok=True)

    zip_path = os.path.join(upload_dir, filename)

    with open(zip_path, "wb") as file:
        file.write(file_content)

    with zipfile.ZipFile(zip_path, "r") as zip_file:
        zip_file.extractall(repository_dir)

    return {
        "repository_id": repository_id,
        "repository_path": repository_dir
    }