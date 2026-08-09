from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.llm.rag_service import RAGService


router = APIRouter(
    prefix="/api/chat",
    tags=["Chat"]
)


rag_service = RAGService()


class ChatRequest(BaseModel):

    repository_id: str

    message: str = Field(
        min_length=1
    )

    top_k: int = Field(
        default=5,
        ge=1,
        le=10
    )


@router.post("/")
def chat(
    request: ChatRequest
):

    try:

        result = rag_service.answer(
            question=request.message,
            repository_id=request.repository_id,
            top_k=request.top_k
        )

        return result

    except Exception as exc:

        raise HTTPException(
            status_code=500,
            detail=f"Chat failed: {exc}"
        )