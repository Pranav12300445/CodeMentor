from typing import Any

from qdrant_client import models

from app.vector_store.qdrant_service import QdrantService


class KeywordSearch:

    def __init__(self):
        self.qdrant_service = QdrantService()

    def search(
        self,
        query: str,
        repository_id: str,
        limit: int = 10
    ) -> list[dict[str, Any]]:

        query_lower = query.lower()

        # Get a larger candidate set from Qdrant.
        # Keyword matching is performed against the stored code payload.
        results = self.qdrant_service.client.scroll(
            collection_name="codementor_code",
            scroll_filter=models.Filter(
                must=[
                    models.FieldCondition(
                        key="repository_id",
                        match=models.MatchValue(
                            value=repository_id
                        )
                    )
                ]
            ),
            limit=100,
            with_payload=True,
            with_vectors=False
        )

        matches = []

        for point in results[0]:

            payload = point.payload or {}

            code = str(
                payload.get("code", "")
            )

            file_path = str(
                payload.get("file_path", "")
            )

            name = str(
                payload.get("name", "")
            )

            searchable_text = (
                code + " " +
                file_path + " " +
                name
            ).lower()

            score = self._keyword_score(
                query_lower,
                searchable_text,
                code,
                name,
                file_path
            )

            if score <= 0:
                continue

            matches.append({
                "score": score,
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

        matches.sort(
            key=lambda result: result["score"],
            reverse=True
        )

        return matches[:limit]

    @staticmethod
    def _keyword_score(
        query: str,
        searchable_text: str,
        code: str,
        name: str,
        file_path: str
    ) -> float:

        query_terms = [
            term
            for term in query.split()
            if len(term) > 2
        ]

        if not query_terms:
            return 0.0

        score = 0.0

        code_lower = code.lower()
        name_lower = name.lower()
        file_lower = file_path.lower()

        for term in query_terms:

            if term in name_lower:
                score += 3.0

            if term in file_lower:
                score += 2.0

            if term in code_lower:
                score += 1.0

            if term in searchable_text:
                score += 0.5

        return score