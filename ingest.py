# ===============================================================
# FILE 1: ingest.py
# ==================================================================================
# PURPOSE: Load documents from my_docs folder, split them into chunks, create
# embeddings using Ollama, and store everything in FAISS and BM25 for hybrid retrieval.
#
# WHY WE DO THIS:
# - Advanced RAG needs multi-vector retrieval (FAISS + BM25) for precision.
# - We use UnstructuredPDFLoader to understand complex PDFs, layouts, and tables.
# ==================================================================================

from langchain_community.document_loaders import DirectoryLoader, UnstructuredPDFLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_ollama import OllamaEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_community.retrievers import BM25Retriever

import os
import pickle

from config import (
    DOCS_PATH,
    FAISS_DB_PATH,
    BM25_INDEX_PATH,
    CHUNK_SIZE,
    CHUNK_OVERLAP,
    OLLAMA_BASE_URL,
    EMBEDDING_MODEL,
    validate_config
)

def load_documents():
    """Load all .txt and .pdf files from DOCS_PATH."""
    if not os.path.exists(DOCS_PATH):
        print(f"❌ ERROR: Folder '{DOCS_PATH}' does not exist!")
        return []
    
    print(f"\n📂 Loading documents from: {DOCS_PATH}")
    documents = []
    
    # Load .txt files
    loader = DirectoryLoader(
        path=DOCS_PATH,
        glob="**/*.txt",
        loader_cls=TextLoader,
        silent_errors=True,
        recursive=True
    )
    documents.extend(loader.load())
    
    # Load .pdf files with Unstructured for OCR, Layout & Table extraction
    pdf_loader = DirectoryLoader(
        path=DOCS_PATH,
        glob="**/*.pdf",
        loader_cls=UnstructuredPDFLoader,
        loader_kwargs={"strategy": "hi_res", "mode": "elements"},
        silent_errors=True,
        recursive=True
    )
    documents.extend(pdf_loader.load())
    
    print(f"✅ Loaded {len(documents)} documents elements")
    
    if len(documents) == 0:
        print(f"⚠️  No .txt or .pdf files found in {DOCS_PATH}")
    
    return documents

def chunk_documents(documents):
    """Split documents into smaller chunks with overlap."""
    if not documents:
        return []
    
    print(f"\n✂️  Chunking {len(documents)} document elements...")
    
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        length_function=len,
    )
    
    chunks = splitter.split_documents(documents)
    
    print(f"✅ Created {len(chunks)} chunks")
    return chunks

def create_embeddings_and_store(chunks):
    """Create FAISS and BM25 indices and store them."""
    if not chunks:
        return False
    
    print(f"\n🔢 Creating embeddings for {len(chunks)} chunks using {EMBEDDING_MODEL}...")
    
    # 1. Create Dense Embeddings (FAISS)
    embeddings = OllamaEmbeddings(
        model=EMBEDDING_MODEL,
        base_url=OLLAMA_BASE_URL,
    )
    
    print("   Building FAISS VectorStore...")
    faiss_db = FAISS.from_documents(chunks, embeddings)
    
    # FAISS save_local handles directory creation, but we ensure parent exists
    os.makedirs(os.path.dirname(os.path.abspath(FAISS_DB_PATH)), exist_ok=True)
    faiss_db.save_local(FAISS_DB_PATH)
    print(f"   ✅ FAISS index saved to {FAISS_DB_PATH}")
    
    # 2. Create Sparse Keywords (BM25)
    print("   Building BM25 Keyword Index...")
    bm25_retriever = BM25Retriever.from_documents(chunks)
    
    os.makedirs(BM25_INDEX_PATH, exist_ok=True)
    with open(f"{BM25_INDEX_PATH}/bm25.pkl", "wb") as f:
        pickle.dump(bm25_retriever, f)
    print(f"   ✅ BM25 index saved to {BM25_INDEX_PATH}/bm25.pkl")
    
    return True

def main():
    """Run the complete ingestion pipeline."""
    print("\n" + "="*80)
    print("RAG PIPELINE: MULTIMODAL DOCUMENT INGESTION")
    print("="*80)
    
    try:
        validate_config()
    except ValueError as e:
        print(f"❌ Configuration error: {e}")
        return False
    
    documents = load_documents()
    if not documents: return False
    
    chunks = chunk_documents(documents)
    if not chunks: return False
    
    success = create_embeddings_and_store(chunks)
    
    if success:
        print("\n" + "="*80)
        print("✅ INGESTION PIPELINE COMPLETE!")
        print("="*80)
        
    return success

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
