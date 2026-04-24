# ==================================================================================
# FILE 2: api.py
# ==================================================================================
# PURPOSE: FastAPI backend that exposes the RAG pipeline as a REST API.
# 
# This is the "brain" of the RAG system - it takes questions from the Streamlit
# frontend, searches ChromaDB for relevant documents, asks the LLM for an answer,
# checks if that answer is grounded in the source documents, and returns everything
# to the frontend.
#
# WHY WE DO THIS:
# - The Streamlit frontend (app.py) runs on http://localhost:8501
# - The FastAPI backend (this file) runs on http://localhost:8000
# - They communicate over HTTP using JSON, so they can run independently
# - This separation lets the frontend be replaced with a web app, mobile app, etc.
# ==================================================================================

# IMPORTS - Libraries and modules we need for this API
# ==================================================================================

# FastAPI imports - FastAPI is a modern Python web framework
from fastapi import FastAPI, HTTPException, UploadFile, File
# FastAPI: the main framework for building the API
# HTTPException: for returning error responses with status codes
# UploadFile, File: for handling file uploads

from fastapi.middleware.cors import CORSMiddleware
# CORSMiddleware: allows requests from different domains (needed for Streamlit frontend)
# CORS = "Cross-Origin Resource Sharing" - without it, browser blocks frontend->backend calls

from pydantic import BaseModel
# BaseModel: for defining the structure of JSON request/response bodies
# Pydantic validates that incoming JSON matches the expected structure

# LangChain imports - for RAG pipeline components
from langchain_chroma import Chroma
# Chroma: loads our vector database (created by ingest.py)

from langchain_ollama import OllamaEmbeddings, OllamaLLM
# OllamaEmbeddings: converts user questions to embeddings for searching
# OllamaLLM: the language model (llama3.2) that generates answers

from langchain_core.prompts import PromptTemplate
# PromptTemplate: a template for the prompt we send to the LLM
# Lets us dynamically insert context, question, etc into the prompt

from langchain_core.runnables import RunnablePassthrough
# RunnablePassthrough: passes input through unchanged (part of LangChain chains)

from langchain_core.output_parsers import StrOutputParser
# StrOutputParser: converts LLM output to a string

from langchain_text_splitters import RecursiveCharacterTextSplitter
# RecursiveCharacterTextSplitter: for formatting chunks (we use it for formatting)

# Import the hallucination checking function
from hallucination import check_grounding
# check_grounding: imported from hallucination.py - checks if answer is grounded

# Import configuration from config.py
from config import (
    OLLAMA_BASE_URL,
    LLM_MODEL,
    EMBEDDING_MODEL,
    CHROMA_DB_PATH,
    TOP_K_RESULTS,
    API_HOST,
    API_PORT,
    API_TIMEOUT,
    LLM_TEMPERATURE,
    LLM_MAX_TOKENS,
    CHECK_GROUNDING,
    validate_config
)
# Import all configuration values from config.py
# This way, we use the same settings everywhere
# If you need to change a value, edit config.py instead of this file

# Python standard library imports
import logging
# logging: for printing informative messages about what the API is doing

from typing import List, Dict, Any
# typing: for type hints (tells Python what types variables should be)
# List, Dict, Any: specific type hints we use in this file

import time
# time: for measuring how long queries take

# ==================================================================================
# LOGGING SETUP - For tracking what's happening
# ==================================================================================

logging.basicConfig(
    level=logging.INFO,
    # Log level: INFO shows normal operations, DEBUG shows extra details
    # Other levels: WARNING, ERROR, CRITICAL
    
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    # Format of log messages: timestamp - logger name - level - message
)

logger = logging.getLogger(__name__)
# Create a logger for this file
# __name__ will be "api" when this file runs directly
# We'll use logger.info(), logger.error(), etc to log messages

# ==================================================================================
# REQUEST/RESPONSE MODELS - Define the structure of JSON data
# ==================================================================================

class QuestionRequest(BaseModel):
    """
    The JSON structure we expect when someone POSTs to /ask endpoint.
    
    Example JSON:
    {
        "question": "What are the types of machine learning?"
    }
    """
    
    question: str
    # The user's question (must be a string)
    # Pydantic will validate this is present and is a string


class SourceDocument(BaseModel):
    """
    Represents one source document chunk in the response.
    
    Example:
    {
        "content": "Machine learning is a subset of AI...",
        "metadata": {"source": "sample_document.txt", "page": 0}
    }
    """
    
    content: str
    # The text of the document chunk
    
    metadata: Dict[str, Any]
    # Dictionary with info about the chunk (filename, page number, etc)


class QuestionResponse(BaseModel):
    """
    The JSON structure we return when someone GETs /ask response.
    
    Example JSON:
    {
        "question": "What is machine learning?",
        "answer": "Machine learning is a subset of AI that...",
        "grounded": true,
        "verdict": "This answer is supported by the source documents.",
        "sources": [
            {"content": "...", "metadata": {...}},
            {"content": "...", "metadata": {...}}
        ]
    }
    """
    
    question: str
    # Echo back the user's original question
    
    answer: str
    # The LLM's answer
    
    grounded: bool
    # Whether the answer is grounded in the source documents (True = yes, False = hallucination)
    
    verdict: str
    # Explanation from check_grounding() - why it's grounded or hallucinated
    
    sources: List[SourceDocument]
    # List of source document chunks used to generate the answer


# ==================================================================================
# INITIALIZE FASTAPI APP
# ==================================================================================

app = FastAPI(
    title="RAG Pipeline API",
    # Name shown in API documentation
    
    description="Local RAG pipeline using Ollama, ChromaDB, and LangChain",
    # Description shown in API documentation
    
    version="1.0.0"
    # Version of the API
)

# Add CORS middleware so Streamlit frontend can call this API
app.add_middleware(
    CORSMiddleware,
    # Use CORS middleware
    
    allow_origins=["*"],
    # Allow requests from ANY origin
    # In production, you'd restrict this to specific domains like ["http://localhost:8501"]
    # "*" means "allow all" - good for development, not production
    
    allow_credentials=True,
    # Allow cookies and authentication credentials
    
    allow_methods=["*"],
    # Allow all HTTP methods (GET, POST, PUT, DELETE, etc)
    
    allow_headers=["*"],
    # Allow any HTTP headers
)

# ==================================================================================
# GLOBAL VARIABLES - Loaded once on startup
# ==================================================================================

vector_db = None
# The ChromaDB vector database (loaded by startup_event())

llm = None
# The Ollama LLM model (loaded by startup_event())

qa_chain = None
# The RetrievalQA chain (loaded by startup_event())

# These are "global" so all API endpoints can use them without reloading

# ==================================================================================
# STARTUP EVENT - Runs once when the API starts
# ==================================================================================

@app.on_event("startup")
# This decorator tells FastAPI to run this function on startup
def startup_event():
    """
    Initialize the RAG pipeline components when the API starts.
    This runs once before the API accepts any requests.
    
    Why we do this:
    - Loading ChromaDB and LLM models takes several seconds
    - We only want to do this once, not for every API request
    - This is called a "startup hook" - it runs at boot time
    """
    
    global vector_db, llm, qa_chain
    # Declare that we're modifying the global variables
    # Without "global", Python would create local variables instead
    
    logger.info("🚀 Starting RAG Pipeline API...")
    logger.info(f"   ChromaDB path: {CHROMA_DB_PATH}")
    logger.info(f"   LLM model: {LLM_MODEL}")
    logger.info(f"   Embedding model: {EMBEDDING_MODEL}")
    
    try:
        # STEP 1: Load embeddings model
        logger.info("📦 Loading embeddings model...")
        embeddings = OllamaEmbeddings(
            model=EMBEDDING_MODEL,
            # Which Ollama model to use for converting questions to embeddings
            
            base_url=OLLAMA_BASE_URL,
            # Where Ollama is running
        )
        logger.info("   ✅ Embeddings model loaded")
        
        # STEP 2: Load ChromaDB vector database
        logger.info("📚 Loading ChromaDB...")
        vector_db = Chroma(
            persist_directory=CHROMA_DB_PATH,
            # Where the database was saved by ingest.py
            
            embedding_function=embeddings,
            # Use the embeddings we just loaded
        )
        logger.info(f"   ✅ ChromaDB loaded from {CHROMA_DB_PATH}")
        
        # STEP 3: Load the LLM model
        logger.info("🧠 Loading LLM model...")
        llm = OllamaLLM(
            model=LLM_MODEL,
            # Which Ollama model to use for generating answers
            
            base_url=OLLAMA_BASE_URL,
            # Where Ollama is running
            
            temperature=LLM_TEMPERATURE,
            # Temperature controls randomness of responses
            # 0.0 = always same answer (deterministic)
            # 1.0 = very random
            # 0.2 = low randomness, mostly consistent
            # For RAG, we want low randomness so answers are factual
        )
        logger.info("   ✅ LLM model loaded")
        
        # STEP 4: Create a custom prompt template
        logger.info("📝 Creating prompt template...")
        
        prompt_template = """
You are a helpful assistant answering questions based ONLY on the provided context.

CONTEXT:
{context}

QUESTION: {question}

INSTRUCTIONS:
1. Answer ONLY using information from the context above
2. If the answer is not in the context, say "I don't know"
3. Be concise but complete
4. Cite the context when relevant

ANSWER:
        """.strip()
        # Create a template for prompts we send to the LLM
        # {context} will be replaced with relevant documents
        # {question} will be replaced with the user's question
        # .strip() removes leading/trailing whitespace
        
        prompt = PromptTemplate(
            input_variables=["context", "question"],
            # Variables that will be filled in dynamically
            
            template=prompt_template,
            # The template string defined above
        )
        
        # STEP 5: Create the retrieval chain
        logger.info("⛓️  Creating retrieval chain...")
        
        # Create a retriever from ChromaDB that returns source documents
        retriever = vector_db.as_retriever(search_kwargs={"k": TOP_K_RESULTS})
        # search_kwargs={"k": 4} means retrieve top 4 most similar chunks
        
        # Create a wrapper class to manage the RAG chain with source tracking
        class RAGChainWrapper:
            """
            Wraps the RAG chain to track source documents for hallucination detection.
            """
            
            def __init__(self, prompt, llm, retriever):
                self.prompt = prompt
                self.llm = llm
                self.retriever = retriever
                self.last_source_docs = []
                # Store the documents retrieved on the last query
            
            def invoke(self, question):
                """
                Execute the RAG pipeline for a question
                """
                # Step 1: Retrieve relevant documents
                self.last_source_docs = self.retriever.invoke(question)
                
                # Step 2: Format documents as context
                context = "\n\n".join([doc.page_content for doc in self.last_source_docs])
                
                # Step 3: Fill the prompt template
                formatted_prompt = self.prompt.format(context=context, question=question)
                
                # Step 4: Get answer from LLM
                answer = self.llm.invoke(formatted_prompt)
                
                return answer
        
        # Create the wrapper instance
        qa_chain = RAGChainWrapper(prompt, llm, retriever)
        
        logger.info("   ✅ Retrieval chain created")
        
        logger.info("✅ RAG Pipeline API is ready!")
        logger.info(f"   🌐 API running at http://{API_HOST}:{API_PORT}")
        logger.info(f"   📚 API docs at http://localhost:{API_PORT}/docs")
        
    except Exception as e:
        # If something goes wrong during startup, log the error
        logger.error(f"❌ Failed to initialize API: {e}")
        # We don't exit here - FastAPI will still start but requests will fail
        # This is better than crashing so we can see the error message


# ==================================================================================
# ENDPOINT 1: GET /health
# ==================================================================================

@app.get("/health")
# This decorator creates a GET endpoint at /health
# GET means "retrieve information" (no body required)
def health_check():
    """
    Health check endpoint - returns ok if API is running.
    
    Used by monitoring systems and the Streamlit frontend to verify
    the API is alive before making expensive requests.
    
    Usage: curl http://localhost:8000/health
    
    Response: {"status": "ok"}
    """
    
    return {"status": "ok"}
    # Return a simple JSON response
    # FastAPI automatically converts this dict to JSON


# ==================================================================================
# ENDPOINT 2: POST /ask
# ==================================================================================

@app.post("/ask")
# This decorator creates a POST endpoint at /ask
# POST means "submit data" (includes a JSON body)
async def ask_question(request: QuestionRequest) -> QuestionResponse:
    """
    Main RAG endpoint - takes a question and returns an answer with sources.
    
    This is where the magic happens:
    1. User sends: {"question": "What is machine learning?"}
    2. We search ChromaDB for relevant documents
    3. We send those documents + question to the LLM
    4. We get an answer from the LLM
    5. We check if that answer is grounded in the documents
    6. We return: answer + sources + grounding status
    
    Usage:
        curl -X POST http://localhost:8000/ask \
             -H "Content-Type: application/json" \
             -d '{"question": "What is machine learning?"}'
    
    Response:
        {
            "question": "What is machine learning?",
            "answer": "Machine learning is...",
            "grounded": true,
            "verdict": "...",
            "sources": [...]
        }
    """
    
    # Check if API is initialized
    if qa_chain is None:
        # If qa_chain is still None, the startup failed
        logger.error("❌ RAG pipeline not initialized!")
        raise HTTPException(
            status_code=503,
            # 503 = "Service Unavailable" (the API isn't ready yet)
            
            detail="RAG pipeline not initialized. Check that Ollama is running and ChromaDB exists."
            # Error message to return to the user
        )
    
    # Check if ChromaDB is empty
    try:
        # Try to count documents in ChromaDB
        doc_count = vector_db._collection.count()
        # _collection.count() returns how many embeddings are stored
        
        if doc_count == 0:
            # If no documents, we can't answer questions
            logger.warning("⚠️  ChromaDB is empty!")
            raise HTTPException(
                status_code=400,
                # 400 = "Bad Request" (user needs to ingest documents first)
                
                detail="No documents found in ChromaDB. Please run ingest.py first to load documents."
                # Tell the user what to do
            )
    except Exception as e:
        logger.error(f"❌ Error checking ChromaDB: {e}")
        raise HTTPException(
            status_code=500,
            # 500 = "Internal Server Error" (something broke on our side)
            
            detail="Error accessing ChromaDB database"
        )
    
    # Log the incoming question
    user_question = request.question.strip()
    # .strip() removes leading/trailing whitespace
    
    if not user_question:
        # If question is empty, that's an error
        raise HTTPException(
            status_code=400,
            detail="Question cannot be empty"
        )
    
    logger.info(f"❓ Question received: {user_question}")
    
    # Measure how long this takes
    start_time = time.time()
    # Record the current time
    
    try:
        # STEP 1: Query the retrieval chain
        logger.info("   🔍 Searching ChromaDB...")
        
        # Call the chain with the user's question
        answer = qa_chain.invoke(user_question)
        # The invoke method retrieves documents and generates an answer
        
        # Get the source documents that were retrieved (stored by our wrapper)
        source_documents = qa_chain.last_source_docs
        # These are Document objects with .page_content and .metadata
        
        logger.info(f"   ✅ Found {len(source_documents)} relevant documents")
        answer_preview = answer[:100] if len(answer) > 100 else answer
        logger.info(f"   📝 Answer generated: {answer_preview}...")
        # Log first 100 characters of answer, or all of it if shorter
        
        # STEP 2: Extract source chunk texts for grounding check
        source_texts = [doc.page_content for doc in source_documents]
        # doc.page_content is the text of each chunk
        # This is a list comprehension - compact way to extract data from a list
        
        # STEP 3: Check if answer is grounded in sources
        logger.info("   🔬 Checking if answer is grounded in sources...")
        
        is_grounded, verdict = check_grounding(
            answer=answer,
            # The LLM's answer we want to verify
            
            source_chunks=source_texts,
            # The document chunks we used
            
            llm=llm,
            # The LLM to use for checking grounding
        )
        
        grounding_status = "✅ Grounded" if is_grounded else "⚠️  Hallucination Risk"
        logger.info(f"   {grounding_status}: {verdict}")
        
        # STEP 4: Format source documents for response
        formatted_sources = [
            SourceDocument(
                content=doc.page_content,
                # The text of the chunk
                
                metadata=doc.metadata,
                # Metadata like filename, page number, etc
            )
            for doc in source_documents
            # This is a list comprehension - creates a SourceDocument for each chunk
        ]
        
        # STEP 5: Build the response
        response = QuestionResponse(
            question=user_question,
            # Echo back the user's question
            
            answer=answer,
            # The LLM's answer
            
            grounded=is_grounded,
            # Whether it's grounded in sources
            
            verdict=verdict,
            # Explanation of grounding status
            
            sources=formatted_sources,
            # List of source documents
        )
        
        # Calculate how long this took
        elapsed_time = time.time() - start_time
        # Get current time and subtract start time
        
        logger.info(f"   ⏱️  Response time: {elapsed_time:.2f} seconds")
        
        return response
        # Return the response (FastAPI converts it to JSON automatically)
        
    except HTTPException as e:
        # If we raised an HTTPException above, re-raise it
        raise e
        
    except Exception as e:
        # Catch any other unexpected errors
        logger.error(f"❌ Error processing question: {e}", exc_info=True)
        # exc_info=True includes the full error traceback in logs
        
        raise HTTPException(
            status_code=500,
            # 500 = Internal Server Error
            
            detail=f"Error processing question: {str(e)}"
            # Return the error message to the user
        )


# ==================================================================================
# ENTRY POINT - Run the API with: uvicorn api:app --reload
# ==================================================================================

if __name__ == "__main__":
    # This runs if you execute this file directly (not if it's imported)
    
    import uvicorn
    # uvicorn: the server that runs FastAPI apps
    
    logger.info("Starting Uvicorn server...")
    
    uvicorn.run(
        "api:app",
        # "api:app" means: in module "api", run the "app" FastAPI instance
        
        host=API_HOST,
        # Listen on this IP address (0.0.0.0 = all interfaces)
        
        port=API_PORT,
        # Listen on this port (8000)
        
        reload=True,
        # Auto-reload the server if code changes (useful during development)
        # Set to False in production for better performance
    )


# ==================================================================================
# ENDPOINT 3: POST /upload
# ==================================================================================

@app.post("/upload")
async def upload_file(file):
    """Upload a PDF file to my_docs directory"""
    import os
    import shutil
    from fastapi import UploadFile
    
    try:
        my_docs_dir = "my_docs"
        os.makedirs(my_docs_dir, exist_ok=True)
        
        file_path = os.path.join(my_docs_dir, file.filename)
        
        # Save the uploaded file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        logger.info(f"✅ File uploaded: {file.filename}")
        
        return {
            "filename": file.filename,
            "status": "uploaded",
            "path": file_path
        }
        
    except Exception as e:
        logger.error(f"❌ Error uploading file: {e}")
        raise HTTPException(status_code=400, detail=f"Upload failed: {str(e)}")


# ==================================================================================
# ENDPOINT 4: POST /ingest
# ==================================================================================

@app.post("/ingest")
async def ingest_documents():
    """Ingest all PDF files from my_docs directory"""
    try:
        logger.info("🔄 Starting document ingestion...")
        
        # Import and run the ingest script
        import subprocess
        result = subprocess.run(
            [".venv/bin/python", "ingest.py"],
            capture_output=True,
            text=True,
            timeout=300
        )
        
        if result.returncode != 0:
            logger.error(f"❌ Ingestion failed: {result.stderr}")
            raise HTTPException(
                status_code=500, 
                detail=f"Ingestion failed: {result.stderr}"
            )
        
        logger.info("✅ Document ingestion complete!")
        
        return {
            "status": "ingested",
            "message": "Documents processed and indexed successfully"
        }
        
    except subprocess.TimeoutExpired:
        logger.error("❌ Ingestion timeout")
        raise HTTPException(status_code=504, detail="Ingestion timeout")
        
    except Exception as e:
        logger.error(f"❌ Error during ingestion: {e}")
        raise HTTPException(status_code=500, detail=f"Ingestion error: {str(e)}")

# ==================================================================================
# HOW TO RUN THIS FILE:
# ==================================================================================
#
# In a terminal:
#     cd /Users/ayush/Downloads/rag-pipeline
#     source .venv/bin/activate
#     uvicorn api:app --reload
#
# You should see:
#     Uvicorn running on http://0.0.0.0:8000
#     Application startup complete
#
# The API will automatically load ChromaDB and the LLM on startup.
#
# Test it with:
#     curl http://localhost:8000/health
#     # Should return: {"status":"ok"}
#
#     curl -X POST http://localhost:8000/ask \
#          -H "Content-Type: application/json" \
#          -d '{"question":"What is machine learning?"}'
#     # Should return: {...the answer...}
#
# ==================================================================================
