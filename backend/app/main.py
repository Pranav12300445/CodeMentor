from fastapi import FastAPI

from app.api.routes import repository


app = FastAPI(
    title="CodeMentor AI",
    description="Multi-language AI Codebase RAG",
    version="1.0.0"
)


app.include_router(repository.router)


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