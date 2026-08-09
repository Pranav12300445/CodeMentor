from pathlib import Path
from typing import Any

from app.ingestion.file_scanner import scan_repository
from app.ingestion.language_detector import detect_language
from app.parsers.tree_sitter_parser import TreeSitterParser
from app.chunking.code_chunker import create_code_chunks
from app.ingestion.indexing_service import IndexingService


class RepositoryProcessor:

    def __init__(self):
        self.parser = TreeSitterParser()
        self.indexing_service = IndexingService()

    def process_repository(
        self,
        repository_path: str,
        repository_id: str
    ) -> dict[str, Any]:

        files = scan_repository(repository_path)

        processed_files = []
        skipped_files = []
        all_chunks = []

        for relative_path in files:

            file_path = Path(repository_path) / relative_path

            language = detect_language(relative_path)

            # Ignore unsupported/non-source files
            if language == "Unknown":
                skipped_files.append({
                    "file": relative_path,
                    "reason": "Unsupported file type"
                })
                continue

            try:
                source_code = file_path.read_text(
                    encoding="utf-8",
                    errors="replace"
                )

            except Exception as exc:
                skipped_files.append({
                    "file": relative_path,
                    "reason": f"Unable to read file: {exc}"
                })
                continue

            # Ignore empty files
            if not source_code.strip():
                skipped_files.append({
                    "file": relative_path,
                    "reason": "Empty file"
                })
                continue

            try:

                structures = self.parser.parse(
                    source_code=source_code,
                    language=language,
                    file_path=relative_path
                )

                chunks = create_code_chunks(structures)

                for chunk in chunks:
                    all_chunks.append(chunk.to_dict())

                processed_files.append({
                    "file": relative_path,
                    "language": language,
                    "structure_count": len(structures),
                    "chunk_count": len(chunks)
                })

            except Exception as exc:

                skipped_files.append({
                    "file": relative_path,
                    "reason": f"Parser error: {exc}"
                })

        # Index all generated chunks into Qdrant
        indexed_count = self.indexing_service.index_chunks(
            chunks=all_chunks,
            repository_id=repository_id
        )

        return {
            "repository_id": repository_id,
            "repository_path": repository_path,
            "total_files": len(files),
            "processed_files": len(processed_files),
            "skipped_files": len(skipped_files),
            "total_chunks": len(all_chunks),
            "indexed_chunks": indexed_count,
            "files": processed_files,
            "skipped": skipped_files,
            "chunks": all_chunks
        }
