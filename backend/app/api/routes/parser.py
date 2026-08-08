from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.parsers.tree_sitter_parser import TreeSitterParser
from app.chunking.code_chunker import create_code_chunks


router = APIRouter(
    prefix="/api/parser",
    tags=["Parser"]
)


class ParseRequest(BaseModel):
    language: str
    code: str
    file_path: str = "unknown"


@router.post("/parse")
def parse_code(request: ParseRequest):

    parser = TreeSitterParser()

    try:

        structures = parser.parse(
            source_code=request.code,
            language=request.language,
            file_path=request.file_path
        )

        chunks = create_code_chunks(
            structures
        )

        return {
            "language": request.language,
            "file_path": request.file_path,
            "structure_count": len(structures),
            "chunk_count": len(chunks),
            "structures": [
                structure.to_dict()
                for structure in structures
            ],
            "chunks": [
                chunk.to_dict()
                for chunk in chunks
            ]
        }

    except ValueError as exc:

        raise HTTPException(
            status_code=400,
            detail=str(exc)
        )

    except Exception as exc:

        raise HTTPException(
            status_code=500,
            detail=f"Parser error: {exc}"
        )