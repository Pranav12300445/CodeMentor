from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.retrieval.semantic_search import SemanticSearch


router = APIRouter(
    prefix="/api/search",
    tags=["Search"]
)


search_service = SemanticSearch()


class SearchRequest(BaseModel):

    repository_id: str

    query: str = Field(
        min_length=1
    )

    top_k: int = Field(
        default=5,
        ge=1,
        le=20
    )


@router.post("/semantic")
def semantic_search(
    request: SearchRequest
):

    try:

        results = search_service.search(
            query=request.query,
            repository_id=request.repository_id,
            top_k=request.top_k
        )

        return {
            "repository_id": request.repository_id,
            "query": request.query,
            "count": len(results),
            "results": results
        }

    except Exception as exc:

        raise HTTPException(
            status_code=500,
            detail=f"Search failed: {exc}"
        )