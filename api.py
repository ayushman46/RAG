# ==================================================================================
# FILE 2: api.py
# ==================================================================================
# PURPOSE: FastAPI backend that exposes the Multimodal Document Intelligence Engine.
# Uses EnsembleRetriever (FAISS + BM25) for high accuracy multi-vector search.
# ==================================================================================

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import pickle
import logging
import time
from typing import List, Dict, Any

from langchain_community.vectorstores import FAISS
from langchain_ollama import OllamaEmbeddings, OllamaLLM
from langchain_classic.retrievers import EnsembleRetriever
from langchain_core.prompts import PromptTemplate

from config import (
    OLLAMA_BASE_URL,
    LLM_MODEL,
    EMBEDDING_MODEL,
    FAISS_DB_PATH,
    BM25_INDEX_PATH,
    TOP_K_RESULTS,
    API_HOST,
    API_PORT,
    API_TIMEOUT,
    LLM_TEMPERATURE,
)
from hallucination import check_grounding

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

class QuestionRequest(BaseModel):
    question: str

class SourceDocument(BaseModel):
    content: str
    metadata: Dict[str, Any]

class QuestionResponse(BaseModel):
    question: str
    answer: str
    grounded: bool
    verdict: str
    sources: List[SourceDocument]

app = FastAPI(title="RAG Pipeline API", description="Advanced Multimodal Document Engine", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ensemble_retriever = None
llm = None
qa_chain = None

@app.on_event("startup")
def startup_event():
    global ensemble_retriever, llm, qa_chain
    logger.info("🚀 Starting Advanced RAG Pipeline API...")
    
    try:
        # Load FAISS
        logger.info("📚 Loading FAISS database...")
        embeddings = OllamaEmbeddings(model=EMBEDDING_MODEL, base_url=OLLAMA_BASE_URL)
        if os.path.exists(FAISS_DB_PATH):
            faiss_db = FAISS.load_local(FAISS_DB_PATH, embeddings, allow_dangerous_deserialization=True)
            faiss_retriever = faiss_db.as_retriever(search_kwargs={"k": TOP_K_RESULTS})
            logger.info("   ✅ FAISS loaded")
        else:
            logger.warning("   ⚠️ FAISS DB not found. Run ingest.py first.")
            faiss_retriever = None

        # Load BM25
        logger.info("🔍 Loading BM25 Keyword Index...")
        bm25_file = f"{BM25_INDEX_PATH}/bm25.pkl"
        if os.path.exists(bm25_file):
            with open(bm25_file, "rb") as f:
                bm25_retriever = pickle.load(f)
                bm25_retriever.k = TOP_K_RESULTS
            logger.info("   ✅ BM25 loaded")
        else:
            logger.warning("   ⚠️ BM25 index not found. Run ingest.py first.")
            bm25_retriever = None

        # Create Ensemble Retriever
        if faiss_retriever and bm25_retriever:
            ensemble_retriever = EnsembleRetriever(
                retrievers=[bm25_retriever, faiss_retriever],
                weights=[0.3, 0.7] # 30% keyword, 70% semantic
            )
            logger.info("   ✅ Ensemble Retriever initialized")
        
        # Load LLM
        logger.info("🧠 Loading LLM model...")
        llm = OllamaLLM(model=LLM_MODEL, base_url=OLLAMA_BASE_URL, temperature=LLM_TEMPERATURE)
        
        # Setup Prompt & Chain Wrapper
        prompt_template = """
You are an intelligent document analyst. Answer the question using ONLY the provided context.
If the answer is found in a table or structured data, extract it accurately.

CONTEXT:
{context}

QUESTION: {question}

INSTRUCTIONS:
1. Answer ONLY using information from the context above
2. If the answer is not in the context, say "I don't know"
3. Cite the context when relevant

ANSWER:
        """.strip()
        prompt = PromptTemplate(input_variables=["context", "question"], template=prompt_template)
        
        class RAGChainWrapper:
            def __init__(self, prompt, llm, retriever):
                self.prompt = prompt
                self.llm = llm
                self.retriever = retriever
                self.last_source_docs = []
            
            def invoke(self, question):
                if not self.retriever:
                    raise Exception("Retriever not initialized")
                self.last_source_docs = self.retriever.invoke(question)
                context = "\n\n".join([doc.page_content for doc in self.last_source_docs])
                formatted_prompt = self.prompt.format(context=context, question=question)
                return self.llm.invoke(formatted_prompt)
        
        qa_chain = RAGChainWrapper(prompt, llm, ensemble_retriever)
        logger.info("✅ API is ready!")
        
    except Exception as e:
        logger.error(f"❌ Failed to initialize API: {e}")

@app.get("/health")
def health_check():
    return {"status": "ok", "retriever": "ensemble" if ensemble_retriever else "none"}

@app.post("/ask")
async def ask_question(request: QuestionRequest) -> QuestionResponse:
    if qa_chain is None or ensemble_retriever is None:
        raise HTTPException(status_code=503, detail="Pipeline not fully initialized. Please run ingest.py.")
    
    user_question = request.question.strip()
    if not user_question:
        raise HTTPException(status_code=400, detail="Question cannot be empty")
    
    start_time = time.time()
    try:
        answer = qa_chain.invoke(user_question)
        source_documents = qa_chain.last_source_docs
        source_texts = [doc.page_content for doc in source_documents]
        
        is_grounded, verdict = check_grounding(answer=answer, source_chunks=source_texts, llm=llm)
        
        formatted_sources = [
            SourceDocument(content=doc.page_content, metadata=doc.metadata)
            for doc in source_documents
        ]
        
        elapsed = time.time() - start_time
        logger.info(f"⏱️ Response time: {elapsed:.2f}s")
        
        return QuestionResponse(
            question=user_question,
            answer=answer,
            grounded=is_grounded,
            verdict=verdict,
            sources=formatted_sources,
        )
    except Exception as e:
        logger.error(f"Error processing question: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/upload")
async def upload_file(file):
    import shutil
    try:
        os.makedirs("my_docs", exist_ok=True)
        file_path = os.path.join("my_docs", file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        return {"filename": file.filename, "status": "uploaded"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Upload failed: {str(e)}")

@app.post("/ingest")
async def ingest_documents():
    import subprocess
    try:
        result = subprocess.run([".venv/bin/python", "ingest.py"], capture_output=True, text=True, timeout=600)
        if result.returncode != 0:
            raise HTTPException(status_code=500, detail=f"Ingestion failed: {result.stderr}")
        return {"status": "ingested", "message": "Documents indexed successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api:app", host=API_HOST, port=API_PORT, reload=True)
