from typing import List, Dict, Any

from app.embeddings.embedding_service import (
    EmbeddingService
)

from app.vector_store.qdrant_service import (
    QdrantService
)


class IndexingService:

    def __init__(self):

        self.embedding_service = (
            EmbeddingService()
        )

        self.qdrant_service = (
            QdrantService()
        )

        self.qdrant_service.create_collection(
            self.embedding_service.dimension
        )

    def index_chunks(
        self,
        chunks: List[Dict[str, Any]],
        repository_id: str
    ):

        if not chunks:
            return 0

        texts = [
            self._build_embedding_text(chunk)
            for chunk in chunks
        ]

        vectors = (
            self.embedding_service.embed_texts(
                texts
            )
        )

        payloads = []

        for chunk in chunks:

            payload = {
                "repository_id": repository_id,
                "language": chunk["language"],
                "file_path": chunk["file_path"],
                "node_type": chunk["node_type"],
                "name": chunk["name"],
                "parent": chunk["parent"],
                "start_line": chunk["start_line"],
                "end_line": chunk["end_line"],
                "code": chunk["code"]
            }

            payloads.append(payload)

        return self.qdrant_service.upsert_chunks(
            vectors=vectors,
            payloads=payloads
        )

    @staticmethod
    def _build_embedding_text(
        chunk: Dict[str, Any]
    ) -> str:

        return f"""
Language: {chunk["language"]}
File: {chunk["file_path"]}
Type: {chunk["node_type"]}
Name: {chunk["name"]}
Parent: {chunk["parent"]}

Code:

{chunk["code"]}
""".strip()