from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.retrieval.semantic_search import SemanticSearch
from app.retrieval.hybrid_search import HybridSearch
from app.retrieval.context_builder import ContextBuilder


router = APIRouter(
    prefix="/api/search",
    tags=["Search"]
)


semantic_service = SemanticSearch()
hybrid_service = HybridSearch()
context_builder = ContextBuilder()


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

        results = semantic_service.search(
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
            detail=f"Semantic search failed: {exc}"
        )


@router.post("/hybrid")
def hybrid_search(
    request: SearchRequest
):

    try:

        results = hybrid_service.search(
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
            detail=f"Hybrid search failed: {exc}"
        )
        
@router.post("/context")
def build_context(
    request: SearchRequest
):

    try:

        results = hybrid_service.search(
            query=request.query,
            repository_id=request.repository_id,
            top_k=request.top_k
        )

        context = context_builder.build(
            results
        )

        return {
            "repository_id": request.repository_id,
            "query": request.query,
            "search_results": len(results),
            **context
        }

    except Exception as exc:

        raise HTTPException(
            status_code=500,
            detail=f"Context building failed: {exc}"
        )