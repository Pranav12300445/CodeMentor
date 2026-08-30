from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import repository
from app.api.routes import parser
from app.api.routes import search
from app.api.routes import chat
from app.database.database import initialize_database


app = FastAPI(
    title="CodeMentor AI",
    description="Multi-language AI Codebase RAG",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

initialize_database()

app.include_router(repository.router)
app.include_router(parser.router)
app.include_router(search.router)
app.include_router(chat.router)


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