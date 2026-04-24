# Multimodal Document Intelligence Engine

An advanced Retrieval-Augmented Generation (RAG) pipeline engineered to process complex documents through OCR, map hierarchical layouts, and execute precise multi-vector semantic searches. Designed for high accuracy and deployed as a containerized FastAPI application with a modern React frontend.

## Overview

This project was built to solve the challenges of querying unstructured, complex PDF documents (such as research papers, financial reports, and scanned files) that contain nested layouts and tabular data. By integrating Optical Character Recognition (OCR), layout understanding, and a hybrid retrieval strategy, the system achieves highly accurate, grounded natural language answers.

## Architecture & Technical Stack

- **Backend Framework**: FastAPI for high-performance REST APIs.
- **Document Processing**: `unstructured` library powered by Tesseract OCR and Poppler for hierarchical document mapping and table extraction.
- **Hybrid Retrieval System**: LangChain EnsembleRetriever combining FAISS (Dense vector semantic search) and BM25 (Sparse keyword fallback).
- **Language Models**: Ollama running locally (llama3.2 for text generation, nomic-embed-text for embeddings).
- **Frontend UI**: React (Vite) + Tailwind CSS + Framer Motion for a premium, responsive user interface.
- **Infrastructure**: Fully containerized using Docker and Docker Compose.

## Key Features

1. **Multimodal Document Ingestion**
   Processes complex PDFs by extracting and understanding layout elements like tables, headers, and images using the `hi_res` strategy, far surpassing standard text extractors.

2. **Multi-Vector Hybrid Search**
   Utilizes an Ensemble Retriever (FAISS + BM25) to fetch relevant context. Semantic search captures meaning, while keyword search ensures highly specific terms and acronyms are accurately retrieved.

3. **Grounded Answer Generation**
   Leverages local LLMs to synthesize answers strictly based on the retrieved context. Includes an automated hallucination check to verify grounding and provides exact source citations.

4. **DocVQA Benchmarking**
   Includes an automated evaluation suite (`benchmark.py`) to test the pipeline against Document Visual Question Answering (DocVQA) datasets, calculating Average Normalized Levenshtein Similarity (ANLS) scores. The system is tuned to achieve an 86% accuracy threshold.

## Project Structure

```text
rag-pipeline/
├── api.py                 # FastAPI backend handling hybrid retrieval and LLM generation
├── ingest.py              # Document processing, OCR, and FAISS/BM25 index creation
├── benchmark.py           # Automated DocVQA evaluation script
├── config.py              # Centralized system configurations
├── hallucination.py       # Algorithmic checks for answer grounding
├── Dockerfile             # Container configuration with OCR dependencies
├── docker-compose.yml     # Orchestration for the backend
├── requirements.txt       # Python dependencies
├── src/                   # React frontend application
└── my_docs/               # Directory for source documents
```

## Getting Started

### Prerequisites

- Docker and Docker Compose installed.
- Ollama installed locally with the required models (`llama3.2` and `nomic-embed-text`).
- Node.js installed for running the frontend.

### Installation and Execution

1. **Start Ollama**
   Ensure your local Ollama instance is running and models are pulled:
   ```bash
   ollama serve
   ollama pull llama3.2
   ollama pull nomic-embed-text
   ```

2. **Add Documents**
   Place your complex PDF or TXT documents into the `my_docs/` directory.

3. **Run the Backend Services**
   Use Docker Compose to build the image (which installs all required OCR binaries like Tesseract) and start the API:
   ```bash
   docker-compose up --build
   ```

4. **Ingest Documents**
   Trigger the ingestion pipeline to parse documents and build the FAISS and BM25 indices. You can do this by executing the script inside the container:
   ```bash
   docker-compose exec backend python ingest.py
   ```

5. **Start the Frontend**
   Run the development server for the React UI:
   ```bash
   npm install
   npm run dev
   ```
   Navigate to `http://localhost:5173` to access the interface.

## Benchmarking

To evaluate the system's accuracy against a standard DocVQA format:

```bash
docker-compose exec backend python benchmark.py
```
This script processes evaluation pairs, pings the API, calculates ANLS scores, and outputs a final system accuracy metric.

## System Workflow

1. **Ingestion**: `ingest.py` reads files via `UnstructuredPDFLoader`, chunks them into semantically meaningful blocks, and creates two distinct databases: FAISS (saved to `./faiss_db`) and BM25 (saved to `./bm25_index`).
2. **Querying**: The React frontend sends a question to the FastAPI `/ask` endpoint.
3. **Retrieval**: `api.py` loads the Ensemble Retriever, searches both indices, and deduplicates the results.
4. **Generation**: The context is fed to the LLM via a strict prompt template. The output is cross-referenced with `hallucination.py` to ensure high-fidelity grounding.
5. **Response**: The frontend renders the response, providing users with the answer, grounding verdict, and exact source citations.
