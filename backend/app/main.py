from fastapi import FastAPI

from app.api.routes import repository
from app.api.routes import parser
from app.api.routes import search


app = FastAPI(
    title="CodeMentor AI",
    description="Multi-language AI Codebase RAG",
    version="1.0.0"
)


app.include_router(repository.router)
app.include_router(parser.router)
app.include_router(search.router)


@app.get("/")
def root():
    return {
        "message": "CodeMentor AI backend is running"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }