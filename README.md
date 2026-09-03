# 🧠 CodeMentor AI

**AI-powered codebase understanding and retrieval-augmented generation (RAG) application.**

Upload any codebase, and CodeMentor will parse, index, and let you search and chat with your code using natural language.

---

## ✨ Features

### 📤 Repository Management
- Upload ZIP repositories for automatic processing
- Tree-Sitter powered multi-language code parsing
- Smart code chunking (functions, classes, modules)
- Vector embeddings via `bge-base-en-v1.5`

### 🔍 Intelligent Code Search
- **Smart Search** — combines AI semantic understanding with keyword matching
- **AI Search** — pure embedding-based conceptual similarity
- Configurable result count (5/10/20)
- Score visualization with progress bars
- Collapsible result cards with copy-to-clipboard

### 💬 RAG Chat
- Ask natural language questions about your codebase
- AI retrieves relevant code context before answering
- Inline code highlighting and markdown rendering
- Source references with expandable code previews
- Conversation history with timestamps

### 📁 Code Explorer
- Interactive file tree browser
- Full file viewer with line numbers
- Language detection and file size display
- Breadcrumb navigation and copy support

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│                   Frontend                       │
│    React + TypeScript + Vite (port 5173)        │
│    Components: Dashboard, Explorer, Chat, Search│
└─────────────────┬───────────────────────────────┘
                  │ REST API (proxy)
┌─────────────────▼───────────────────────────────┐
│                   Backend                        │
│    FastAPI + Python (port 8000)                  │
│    ┌─────────────┐  ┌──────────────┐            │
│    │  Ingestion   │  │  Retrieval   │            │
│    │  Pipeline    │  │  Service     │            │
│    └──────┬──────┘  └──────┬───────┘            │
│           │                │                     │
│    ┌──────▼──────┐  ┌──────▼───────┐            │
│    │ Tree-Sitter  │  │  Embedding   │            │
│    │ Parser       │  │  Service     │            │
│    └─────────────┘  └──────────────┘            │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│              Qdrant (port 6333)                  │
│         Vector Database for Embeddings           │
└─────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, TypeScript, Vite, Lucide Icons |
| **Backend** | FastAPI, Python 3.11+ |
| **Code Parsing** | Tree-Sitter (multi-language AST) |
| **Embeddings** | SentenceTransformers (`bge-base-en-v1.5`) |
| **Vector Store** | Qdrant |
| **LLM** | Google Gemini (via `google-genai`) |
| **Database** | SQLite (repository metadata) |

---

## 📋 Prerequisites

- **Python** 3.11+
- **Node.js** 18+
- **Qdrant** running on `localhost:6333`
- **Google Gemini API key** (for chat functionality)

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Pranav12300445/CodeMentor.git
cd CodeMentor
```

### 2. Start Qdrant

```bash
docker run -p 6333:6333 -p 6334:6334 qdrant/qdrant
```

### 3. Set up the backend

```bash
cd backend

# Create virtual environment
python -m venv .venv

# Activate (Windows)
.venv\Scripts\activate

# Activate (macOS/Linux)
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 4. Configure environment

Create `backend/.env`:

```env
GOOGLE_API_KEY=your_gemini_api_key_here
QDRANT_URL=http://localhost:6333
```

### 5. Start the backend

```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

### 6. Set up the frontend

```bash
cd frontend/code-mentor

# Install dependencies
npm install

# Start development server
npm run dev
```

### 7. Open the app

Navigate to **http://localhost:5173** in your browser.

---

## 📡 API Reference

### Repository
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/repository/upload` | Upload a ZIP repository |
| `GET` | `/api/repository/` | List all repositories |
| `GET` | `/api/repository/{id}` | Get repository details |
| `DELETE` | `/api/repository/{id}` | Delete a repository |
| `GET` | `/api/repository/{id}/files` | Get file tree |
| `GET` | `/api/repository/{id}/files/{path}` | Get file content |

### Search
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/search/semantic` | AI-powered semantic search |
| `POST` | `/api/search/hybrid` | Combined semantic + keyword search |

### Chat
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/chat/` | Send a question about the codebase |

### Parser
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/parser/parse` | Parse code and get AST chunks |

---

## 🌐 Supported Languages

Python, JavaScript, TypeScript, Java, C, C++, C#, Go, Rust, PHP, Kotlin, Swift, Dart, Ruby, SQL, HTML, CSS, SCSS, Shell, XML, JSON, YAML, Markdown

---

## 📁 Project Structure

```
CodeMentor/
├── backend/
│   ├── app/
│   │   ├── api/routes/        # FastAPI route handlers
│   │   ├── chunking/          # Code chunk creation
│   │   ├── database/          # SQLite setup
│   │   ├── embeddings/        # SentenceTransformer service
│   │   ├── ingestion/         # File scanning, processing
│   │   ├── parsers/           # Tree-Sitter parser
│   │   ├── retrieval/         # RAG context builder
│   │   ├── services/          # Repository CRUD
│   │   ├── vector_store/      # Qdrant service
│   │   └── main.py            # FastAPI entry point
│   ├── requirements.txt
│   └── .env
├── frontend/
│   └── code-mentor/
│       ├── src/
│       │   ├── components/    # React components
│       │   ├── services/      # API client
│       │   ├── types/         # TypeScript interfaces
│       │   ├── App.tsx        # Main application
│       │   └── index.css      # Design system
│       ├── package.json
│       └── vite.config.ts
├── data/
│   ├── repositories/          # Extracted repos
│   └── uploads/               # Uploaded ZIPs
└── README.md
```

---

## 📄 License

This project is for educational and personal use.

---

Built with ❤️ by [Pranav](https://github.com/Pranav12300445)
