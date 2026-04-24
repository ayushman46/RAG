# Walkthrough: Multimodal Document Intelligence Engine

This document provides an in-depth walkthrough of the entire RAG pipeline from ingestion to deployment. It explains the inner workings of the engine, how the hybrid retrieval operates, and exactly how to containerize and deploy the application.

---

## 0. Beginner's Guide: The Big Picture

If you're completely new to this, don't worry! Here is a simple breakdown of what this project actually does and how all the pieces connect.

Imagine you have a giant stack of complex documents—like invoices, research papers, or financial reports—and you want to ask questions about them. Usually, a computer just sees a PDF as a picture of text. It gets confused by tables, columns, and images. 

Here is how our system solves this, step-by-step:

1. **The Brains (Ollama)**: We use a tool called Ollama. Think of Ollama as the "engine" that runs the AI models right on your computer (instead of sending your private data to the internet). It runs `llama3.2` (the AI that talks to you) and `nomic-embed-text` (a special AI that translates text into numbers so the computer can search it).
2. **Reading the Documents (Ingestion)**: You drop your PDFs into the `my_docs/` folder. We use a powerful reader that uses OCR (Optical Character Recognition). OCR acts like a pair of "eyes" that reads the text, but it also understands *layout*—it knows what a title is, what a paragraph is, and most importantly, it can read tables perfectly without scrambling the rows.
3. **Filing the Information (FAISS + BM25)**: Once the documents are read, we cut them into small chunks and store them in two different digital filing cabinets:
   - **FAISS (The Meaning Cabinet)**: This cabinet organizes chunks by *concepts*. If you search for "money," it knows to pull out chunks talking about "revenue" or "dollars."
   - **BM25 (The Keyword Cabinet)**: This cabinet organizes chunks by *exact words*. If you search for a specific invoice number like "INV-1234," it finds exactly that text.
4. **Asking a Question (The API)**: When you type a question in the web interface, it goes to our FastAPI backend (the middleman). The backend searches *both* filing cabinets to find the most relevant chunks of text. This dual-search method is called "Hybrid Retrieval."
5. **Getting the Answer**: The backend gives your question AND the relevant chunks of text to the AI (Ollama). The AI reads those specific chunks and answers your question based *only* on them. Before showing you the answer, we do a "Grounding Check"—we double-check the AI's work to make sure it didn't invent a fake answer (hallucinate).
6. **Docker (The Magic Box)**: Because the OCR "eyes" require a lot of messy software installations on your computer, we put the backend inside a "Docker container." A container is like a perfectly clean mini-computer inside your computer that has all the right software pre-installed. You just turn it on, and it works flawlessly without messing up your Mac!

Now that you know the big picture, the technical details below will make much more sense!

---

## 1. System Architecture: How It Works

The system is built on a modern architecture designed to ingest complex, unstructured documents (like scanned PDFs), store them intelligently, and answer queries accurately using local Large Language Models (LLMs).

### 1.1 Multimodal Ingestion (`ingest.py`)
Standard text extractors fail on tables, images, and complex columns. To solve this, the pipeline uses the `unstructured` library powered by Tesseract OCR and Poppler.
- **Parsing**: When you run ingestion, it processes documents in the `my_docs/` folder using the `hi_res` strategy. It identifies structural elements (Titles, Text, Tables) instead of just dumping a string of text.
- **Chunking**: The extracted elements are passed to the `RecursiveCharacterTextSplitter`, splitting them into context-rich blocks (e.g., 512 characters).

### 1.2 Dual-Index Storage (FAISS + BM25)
Instead of relying purely on vector embeddings (which can miss exact names or acronyms), we build two databases:
1. **FAISS (Dense Vectors)**: The text chunks are converted into dense vector embeddings using `nomic-embed-text` via Ollama. This captures the *semantic meaning* of the text.
2. **BM25 (Sparse Keywords)**: Simultaneously, an inverted index is created using BM25. This ensures exact word matching works flawlessly. 

### 1.3 Hybrid Retrieval (`api.py`)
When a user asks a question, the API uses LangChain's `EnsembleRetriever`.
- It queries FAISS for conceptual matches.
- It queries BM25 for exact keyword matches.
- It combines the results, weighing them (e.g., 70% FAISS / 30% BM25), and deduplicates them to form the ultimate context window.

### 1.4 Generation and Grounding
- The context window and the user's question are sent to the local `llama3.2` model via Ollama.
- **Hallucination Check**: Before returning the response, the system cross-references the generated answer against the retrieved context to ensure the LLM didn't "hallucinate" (make up) the facts.

---

## 2. Docker Deployment

To guarantee that the advanced OCR libraries (Tesseract, Poppler) run seamlessly without polluting your local OS, the FastAPI backend is completely containerized.

### 2.1 Understanding the `Dockerfile`
The provided `Dockerfile` does the following:
1. Uses a lightweight Python 3.10 image.
2. Runs `apt-get` to install all necessary C-level libraries: `tesseract-ocr`, `poppler-utils`, `libmagic-dev`, and `libgl1-mesa-glx` (needed for OpenCV layout parsing).
3. Installs all Python dependencies from `requirements.txt`.
4. Exposes Port 8000 for the FastAPI server.

### 2.2 Understanding `docker-compose.yml`
The compose file simplifies running the container.
- **Volumes**: It maps your local `./my_docs`, `./faiss_db`, and `./bm25_index` to the container so that databases persist even if the container stops.
- **Ollama Networking**: It uses `host.docker.internal` so the Docker container can communicate with your Mac's native Ollama service running on port 11434.

---

## 3. Step-by-Step Running Guide

### Step 1: Start Ollama Locally
The LLM and Embedding models run directly on your Mac hardware to utilize Apple Silicon acceleration.
```bash
ollama serve
# Ensure models are downloaded:
ollama pull llama3.2
ollama pull nomic-embed-text
```

### Step 2: Add Your Documents
Place any PDFs or TXT files you want to analyze into the `my_docs/` directory.

### Step 3: Build and Start the Docker Backend
In the project root directory, spin up the backend:
```bash
docker-compose up --build -d
```
*Note: The `-d` flag runs it in detached mode. You can view logs using `docker-compose logs -f`.*

### Step 4: Ingest the Documents (Inside Docker)
Since the OCR tools are inside the container, you must run the ingestion script through Docker:
```bash
docker-compose exec backend python ingest.py
```
This will read your files, perform OCR, and generate the `faiss_db` and `bm25_index` folders on your local machine (thanks to volume mapping).

### Step 5: Test the API
You can check if the API is healthy:
```bash
curl http://localhost:8000/health
```

### Step 6: Start the React Frontend
Open a new terminal and start the Vite development server for the UI:
```bash
npm install
npm run dev
```
Navigate to `http://localhost:5173` in your browser. You can now chat with your documents using a premium, multimodal pipeline!

---

## 4. Benchmarking (Optional)
If you want to test the accuracy of the system against DocVQA standards:
```bash
docker-compose exec backend python benchmark.py
```
This script will send automated queries to the API, compare the outputs to expected answers, and calculate an Average Normalized Levenshtein Similarity (ANLS) score.
