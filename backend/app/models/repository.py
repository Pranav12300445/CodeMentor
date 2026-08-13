from pydantic import BaseModel
from typing import Optional


class RepositoryResponse(BaseModel):

    id: str

    name: str

    original_filename: Optional[str] = None

    path: str

    status: str

    total_files: int

    processed_files: int

    skipped_files: int

    total_chunks: int

    created_at: str

    updated_at: str