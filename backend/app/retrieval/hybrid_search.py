from typing import Any

from app.retrieval.semantic_search import SemanticSearch
from app.retrieval.keyword_search import KeywordSearch


class HybridSearch:

    def __init__(self):

        self.semantic_search = SemanticSearch()
        self.keyword_search = KeywordSearch()

    def search(
        self,
        query: str,
        repository_id: str,
        top_k: int = 5
    ) -> list[dict[str, Any]]:

        semantic_results = self.semantic_search.search(
            query=query,
            repository_id=repository_id,
            top_k=top_k * 2
        )

        keyword_results = self.keyword_search.search(
            query=query,
            repository_id=repository_id,
            limit=top_k * 2
        )

        combined = {}

        # Semantic results
        for result in semantic_results:

            key = self._result_key(result)

            combined[key] = {
                **result,
                "semantic_score": result["score"],
                "keyword_score": 0.0
            }

        # Keyword results
        for result in keyword_results:

            key = self._result_key(result)

            if key not in combined:

                combined[key] = {
                    **result,
                    "semantic_score": 0.0,
                    "keyword_score": result["score"]
                }

            else:

                combined[key][
                    "keyword_score"
                ] = result["score"]

        # Normalize and combine scores
        results = []

        max_keyword = max(
            (
                result["keyword_score"]
                for result in combined.values()
            ),
            default=1.0
        )

        for result in combined.values():

            semantic_score = max(
                0.0,
                float(
                    result["semantic_score"]
                )
            )

            keyword_score = (
                result["keyword_score"]
                / max_keyword
            )

            final_score = (
                0.7 * semantic_score
                +
                0.3 * keyword_score
            )

            result["hybrid_score"] = final_score

            results.append(result)

        results.sort(
            key=lambda result: result["hybrid_score"],
            reverse=True
        )

        return results[:top_k]

    @staticmethod
    def _result_key(
        result: dict[str, Any]
    ) -> str:

        return (
            f"{result.get('file_path')}:"
            f"{result.get('start_line')}:"
            f"{result.get('end_line')}"
        )