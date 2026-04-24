# RAG (Retrieval-Augmented Generation) Pipeline 🚀

A complete, production-ready RAG system built with Python on MacBook Air M4 using LangChain, ChromaDB, Ollama, FastAPI, and Streamlit.

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Architecture](#architecture)
3. [Features](#features)
4. [Project Structure](#project-structure)
5. [Configuration](#configuration)
6. [Troubleshooting](#troubleshooting)
7. [Learning Guide](#learning-guide)

---

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- [Ollama](https://ollama.ai/) running locally
- MacBook Air M4 (or similar)

### Installation

1. **Clone/Navigate to project**
   ```bash
   cd /Users/ayush/Downloads/rag-pipeline
   ```

2. **Create and activate virtual environment** (if not already done)
   ```bash
   python3.11 -m venv .venv
   source .venv/bin/activate
   ```

3. **Install dependencies** (if not already done)
   ```bash
   pip install -r requirements.txt
   ```

4. **Ensure Ollama is running**
   ```bash
   # In another terminal
   ollama serve
   
   # Verify models are loaded
   ollama list
   # Should show: nomic-embed-text:latest and llama3.2:latest
   ```

### Running the Pipeline

**Terminal 1: Ingest your documents**
```bash
.venv/bin/python ingest.py
```

Expected output:
```
✅ Loaded 1 documents
✅ Created 6 chunks
✅ Embeddings created and stored in ChromaDB
```

**Terminal 2: Start the API backend**
```bash
.venv/bin/python api.py
```

Expected output:
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

**Terminal 3: Start the Streamlit UI**
```bash
streamlit run app.py
```

Expected output:
```
  You can now view your Streamlit app in your browser.
  Local URL: http://localhost:8501
```

**Open your browser** to: `http://localhost:8501`

---

## 🏗️ Architecture

```
                        RAG Pipeline
                        
    config.py (Central Configuration)
         ↑
    ┌────┼────┐
    ↓         ↓
ingest.py   api.py      app.py (Streamlit)
    ↓         ↑
  [my_docs]  [REST API]
    ↓         ↑
[chroma_db]←→[ChromaDB Search]
             ↑
        hallucination.py
        (Grounding Detection)
```

### Data Flow

1. **Ingestion Phase** (`ingest.py`)
   - Load `.txt` and `.pdf` files from `./my_docs`
   - Split into 512-character chunks (64-char overlap)
   - Generate embeddings using `nomic-embed-text` via Ollama
   - Store in ChromaDB for fast retrieval

2. **API Phase** (`api.py`)
   - Receive questions via HTTP `/ask` endpoint
   - Search ChromaDB for 4 most relevant chunks
   - Pass chunks as context to `llama3.2` LLM
   - Check if answer is grounded in sources
   - Return formatted response with sources

3. **UI Phase** (`app.py`)
   - Beautiful Streamlit interface
   - Chat-like question input
   - Display answer + grounding badge + source documents
   - Persistent chat history

---

## ✨ Features

### Core RAG Capabilities
- ✅ Document ingestion (TXT, PDF)
- ✅ Semantic search using embeddings
- ✅ Context-aware LLM responses
- ✅ Source document retrieval

### Quality Assurance
- ✅ **Hallucination Detection**: Grounding checks ensure answers are based on sources
- ✅ **Source Attribution**: Shows which documents were used
- ✅ **Citation Extraction**: Maps claims to specific sources

### Developer Experience
- ✅ **Centralized Configuration**: All settings in `config.py`
- ✅ **Extensive Comments**: Every line explained for learning
- ✅ **RESTful API**: Easy to integrate with other systems
- ✅ **Beautiful UI**: Professional Streamlit interface

### Scalability
- ✅ **Modular Design**: Each component is independent
- ✅ **Configurable**: Change behavior without code changes
- ✅ **Production Ready**: Error handling, logging, validation

---

## 📁 Project Structure

```
rag-pipeline/
├── config.py                    ← Central configuration (15 categories)
├── ingest.py                    ← Document ingestion pipeline
├── api.py                       ← FastAPI backend (REST API)
├── app.py                       ← Streamlit frontend (Web UI)
├── hallucination.py             ← Grounding/hallucination detection
│
├── my_docs/                     ← Your documents go here
│   └── sample_document.txt      ← Example document
│
├── chroma_db/                   ← Vector database (created by ingest.py)
│   └── [embeddings storage]
│
├── .venv/                       ← Python virtual environment
├── requirements.txt             ← Python dependencies
├── README.md                    ← This file
├── CONFIG_INTEGRATION_COMPLETE.md     ← Configuration changes summary
└── END_TO_END_TEST_REPORT.md         ← Test results
```

---

## ⚙️ Configuration

All settings are in `config.py`. Edit this file to customize behavior:

```python
# Location Settings
DOCS_PATH = "./my_docs"              # Where to load documents from
CHROMA_DB_PATH = "./chroma_db"       # Where to store the vector database

# Ollama Settings
OLLAMA_BASE_URL = "http://localhost:11434"
LLM_MODEL = "llama3.2"               # Main language model
EMBEDDING_MODEL = "nomic-embed-text" # For creating embeddings

# Chunking Settings
CHUNK_SIZE = 512                     # Characters per chunk
CHUNK_OVERLAP = 64                   # Overlap between chunks

# Retrieval Settings
TOP_K_RESULTS = 4                    # Number of documents to retrieve

# API Settings
API_HOST = "0.0.0.0"                 # API host
API_PORT = 8000                      # API port
API_TIMEOUT = 30                     # Request timeout in seconds

# LLM Behavior
LLM_TEMPERATURE = 0.2                # Lower = more consistent
LLM_MAX_TOKENS = 2000                # Maximum response length

# Quality Assurance
CHECK_GROUNDING = True               # Enable hallucination detection
```

### Key Configuration Tips

**For better responses:**
- Increase `TOP_K_RESULTS` (e.g., 6-8) for more context
- Decrease `LLM_TEMPERATURE` (e.g., 0.1) for more consistent answers
- Increase `CHUNK_SIZE` for broader context per chunk

**For faster responses:**
- Decrease `TOP_K_RESULTS` (e.g., 2)
- Decrease `LLM_MAX_TOKENS` (e.g., 500)
- Increase `LLM_TEMPERATURE` to skip grounding check validation

**For your documents:**
1. Place `.txt` or `.pdf` files in `./my_docs/`
2. Run `python ingest.py` to index them
3. Start `api.py` and `app.py` to query

---

## 🔧 Troubleshooting

### "Connection refused" error
**Problem**: API can't connect to Ollama
```
Error: ConnectionRefusedError
```
**Solution**:
```bash
# Ensure Ollama is running
ollama serve

# In another terminal, verify models exist
ollama list
```

### "Model not found" error
**Problem**: Ollama models not loaded
**Solution**:
```bash
# Pull the required models
ollama pull llama3.2
ollama pull nomic-embed-text
```

### "No documents found" error
**Problem**: ingest.py can't find documents
**Solution**:
```bash
# Check if my_docs folder exists
ls -la my_docs/

# Add sample documents
echo "Your text here" > my_docs/sample.txt

# Re-run ingest
python ingest.py
```

### API port already in use
**Problem**: "Address already in use"
**Solution**:
```bash
# Find process using port 8000
lsof -i :8000

# Kill the process
kill -9 <PID>

# Or change the port in config.py
# API_PORT = 8001
```

### Slow responses
**Problem**: Takes 30+ seconds to get an answer
**Solution**:
1. Check if Ollama is using GPU: `ollama ps`
2. Reduce `TOP_K_RESULTS` in config.py
3. Reduce `LLM_MAX_TOKENS` in config.py
4. Use smaller documents in `my_docs/`

---

## 📚 Learning Guide

This project is designed to teach RAG concepts. Each file has extensive comments:

### Understanding the Pipeline

**For Beginners:**
1. Read `config.py` - understand the settings
2. Read `ingest.py` - learn how documents are processed
3. Read `hallucination.py` - understand grounding checks
4. Read `api.py` - see how RAG chain works
5. Read `app.py` - learn UI implementation

**For Intermediate:**
- Modify `config.py` settings and observe results
- Add more documents to `my_docs/` and re-ingest
- Call the API directly with `curl` to understand request/response

**For Advanced:**
- Add custom chunking strategies
- Implement custom retrievers
- Add filters to document search
- Implement reranking for better results

### Key Concepts

**Embeddings**: Convert text to vectors of numbers (e.g., [0.2, -0.5, 0.8, ...])
- Similar texts have similar embeddings
- Used for semantic search (meaning-based, not keyword)

**Chunking**: Breaking documents into small pieces
- Prevents overwhelming the LLM with huge documents
- Overlap helps preserve context at boundaries

**RAG**: Retrieval-Augmented Generation
- Retrieve relevant documents
- Use them as context for the LLM
- More accurate than LLM alone

**Grounding**: Checking if answer comes from sources
- Prevents hallucination (making up facts)
- Verifies answer is based on provided documents

---

## 📊 Performance Metrics

From end-to-end test:

| Metric | Value |
|--------|-------|
| Documents ingested | 1 |
| Total chunks created | 6 |
| Average chunk size | 361 characters |
| API response time | ~13 seconds |
| Relevant documents retrieved | 4 |
| Grounding detection | ✅ Working |

---

## 🤝 Integration

### Using the API

Call the API from any HTTP client:

```bash
# Health check
curl http://localhost:8000/health

# Ask a question
curl -X POST http://localhost:8000/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "What is machine learning?"}'
```

### Integrating with Other Apps

```python
import requests

# Send question to RAG API
response = requests.post(
    "http://localhost:8000/ask",
    json={"question": "Your question here"},
    timeout=30
)

# Get the response
data = response.json()
print(f"Answer: {data['answer']}")
print(f"Grounded: {data['grounded']}")
print(f"Sources: {data['sources']}")
```

---

## 📝 Dependencies

All packages in `requirements.txt`:

```
langchain==0.x.x                 # LLM framework
langchain-community==0.x.x       # Community components
langchain-core==0.x.x            # Core abstractions
langchain-ollama==0.x.x          # Ollama integration
langchain-chroma==0.x.x          # ChromaDB integration
langchain-text-splitters==0.x.x  # Document splitting
chromadb==0.x.x                  # Vector database
ollama==0.x.x                    # Ollama Python client
fastapi==0.x.x                   # REST API framework
uvicorn==0.x.x                   # ASGI server
streamlit==1.x.x                 # Web UI framework
pydantic==2.x.x                  # Data validation
requests==2.x.x                  # HTTP client
```

---

## 🎯 Next Steps

1. ✅ Run the pipeline with the sample document
2. ✅ Customize `config.py` for your needs
3. ✅ Add your own documents to `my_docs/`
4. ✅ Explore the API responses
5. ✅ Integrate with your application
6. ✅ Fine-tune for your use case

---

## 📚 Additional Resources

- [LangChain Documentation](https://python.langchain.com/)
- [ChromaDB Documentation](https://docs.trychroma.com/)
- [Ollama Repository](https://github.com/jmorganca/ollama)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Streamlit Documentation](https://docs.streamlit.io/)

---

## 📄 License

This educational project is provided as-is for learning purposes.

---

## ❓ Questions?

Refer to the comments in each file for detailed explanations of how everything works!

Every line of code has a comment explaining:
- **WHAT** it does
- **WHY** we're doing it
- **HOW** it relates to RAG concepts

Happy learning! 🎉
