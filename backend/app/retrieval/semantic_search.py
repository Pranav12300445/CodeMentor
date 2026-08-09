from typing import Any

from app.embeddings.embedding_service import EmbeddingService
from app.vector_store.qdrant_service import QdrantService


class SemanticSearch:

    def __init__(self):
        self.embedding_service = EmbeddingService()
        self.qdrant_service = QdrantService()

    def search(
        self,
        query: str,
        repository_id: str,
        top_k: int = 5
    ) -> list[dict[str, Any]]:

        query_vector = self.embedding_service.embed_text(
            query
        )

        results = self.qdrant_service.search(
            vector=query_vector,
            repository_id=repository_id,
            limit=top_k
        )

        matches = []

        for point in results.points:

            payload = point.payload or {}

            matches.append({
                "score": point.score,
                "repository_id": payload.get(
                    "repository_id"
                ),
                "language": payload.get(
                    "language"
                ),
                "file_path": payload.get(
                    "file_path"
                ),
                "node_type": payload.get(
                    "node_type"
                ),
                "name": payload.get(
                    "name"
                ),
                "parent": payload.get(
                    "parent"
                ),
                "start_line": payload.get(
                    "start_line"
                ),
                "end_line": payload.get(
                    "end_line"
                ),
                "code": payload.get(
                    "code"
                )
            })

        return matches