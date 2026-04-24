# ==================================================================================
# FILE 5: config.py
# ==================================================================================
# PURPOSE: Centralize all configuration settings in one place
#
# WHY THIS IS IMPORTANT:
# - All hardcoded values spread across files are hard to maintain
# - If you want to change a setting, you have to find it in multiple files
# - This file is the single source of truth for all configuration
# - You can change settings here without touching the main code
# - Environment-specific settings (dev vs production) become easy
#
# HOW TO USE:
# In any Python file, import like this:
#   from config import OLLAMA_BASE_URL, LLM_MODEL, CHROMA_DB_PATH, etc.
# Then use the values directly in your code
# ==================================================================================

# ==================================================================================
# OLLAMA & LLM SETTINGS - Configure which models to use and where
# ==================================================================================

OLLAMA_BASE_URL = "http://localhost:11434"
# Where Ollama is running on your Mac
# Change this if Ollama is on a different machine:
#   - "http://192.168.1.100:11434" if on another computer
#   - "http://ollama.example.com:11434" if using a domain name
# Default: localhost (your Mac)

LLM_MODEL = "llama3.2"
# Which LLM model Ollama should use for generating answers
# Other options:
#   - "llama2" - older, smaller, faster
#   - "mistral" - different model family
#   - "neural-chat" - optimized for conversations
#   - "orca-mini" - smaller, faster
# Make sure you've pulled the model first: ollama pull llama3.2

EMBEDDING_MODEL = "nomic-embed-text"
# Which model to use for creating embeddings (vector representations)
# Other options:
#   - "mxbai-embed-large" - larger, more accurate embeddings
#   - "all-minilm:22m" - smaller, faster, good trade-off
#   - "all-minilm:33m" - middle ground
# Make sure you've pulled this too: ollama pull nomic-embed-text

# ==================================================================================
# PATHS - Where files and databases are stored
# ==================================================================================

CHROMA_DB_PATH = "./chroma_db"
# Where ChromaDB stores the vector database (embeddings, chunks, metadata)
# Change this to an absolute path if you want it elsewhere:
#   - "/Users/ayush/Downloads/rag-pipeline/chroma_db" - absolute path
#   - "/tmp/chroma_db" - temporary location (cleared on reboot)
# Note: ingest.py creates this folder automatically

DOCS_PATH = "./my_docs"
# Where ingest.py looks for documents to index
# Put your .txt and .pdf files here before running ingest.py
# Change this to:
#   - "/Users/ayush/Documents/research" - your Documents folder
#   - "./data" - if you prefer a "data" folder
#   - "/Volumes/External/papers" - if on external drive

# ==================================================================================
# CHUNKING SETTINGS - How documents are split into pieces
# ==================================================================================

CHUNK_SIZE = 512
# Size of each document chunk in characters
# What this means:
#   - 512 characters ≈ 100-150 words
#   - Larger chunks = more context, but less precise retrieval
#   - Smaller chunks = more precise, but might miss context
# Good values to try:
#   - 256 = smaller, more precise (good for specific facts)
#   - 512 = default, balanced (good for most use cases)
#   - 1024 = larger, more context (good for complex topics)
# Adjust based on your document type and questions

CHUNK_OVERLAP = 64
# How many characters to overlap between chunks
# Example: if CHUNK_SIZE=512 and CHUNK_OVERLAP=64:
#   Chunk 1: characters 0-512
#   Chunk 2: characters 448-960 (starts 64 chars before end of Chunk 1)
#   Chunk 3: characters 896-1408
# This prevents context from being lost at chunk boundaries
# Good value: 10% of CHUNK_SIZE
#   - For 256: use 25-30
#   - For 512: use 50-60 (default)
#   - For 1024: use 100-130

# ==================================================================================
# RETRIEVAL SETTINGS - How many documents to search
# ==================================================================================

TOP_K_RESULTS = 4
# How many document chunks to retrieve when answering a question
# More chunks = more context to work with, but slower and more tokens
# Fewer chunks = faster, cheaper, but might miss relevant info
# Good values:
#   - 2-3 = fast, for simple questions
#   - 4-5 = default, balanced (good choice)
#   - 8-10 = comprehensive, for complex questions
#   - 15+ = exhaustive, but slow and expensive

# ==================================================================================
# API SETTINGS - FastAPI backend configuration
# ==================================================================================

API_HOST = "0.0.0.0"
# Which IP addresses can connect to the API
# Options:
#   - "0.0.0.0" = everyone (localhost, other computers on network, etc)
#   - "127.0.0.1" = only localhost (only your Mac)
#   - "192.168.1.100" = specific IP (only that computer)
# Default: 0.0.0.0 (accessible from everywhere)

API_PORT = 8000
# Which port the FastAPI server listens on
# The API will be at: http://localhost:8000
# Change this if 8000 is already in use:
#   - 8001, 8002, 8003, etc.
# But then update Streamlit's API_BASE_URL too!

API_TIMEOUT = 30
# How long to wait for an API response (in seconds)
# If the LLM is slow or stuck, after 30 seconds we time out
# Increase this if your Mac is slow:
#   - 60 = 1 minute (slow Mac)
#   - 120 = 2 minutes (very slow or complex queries)
# Decrease for faster feedback:
#   - 15 = 15 seconds (fast, or risk timing out)

# ==================================================================================
# STREAMLIT SETTINGS - Frontend configuration
# ==================================================================================

STREAMLIT_HOST = "localhost"
# Where the Streamlit app runs
# Keep as "localhost" unless you have a specific reason to change it

STREAMLIT_PORT = 8501
# Which port Streamlit uses
# The UI will be at: http://localhost:8501
# Change if 8501 is in use:
#   - 8502, 8503, etc.

# ==================================================================================
# LLM BEHAVIOR SETTINGS - Control how the LLM generates answers
# ==================================================================================

LLM_TEMPERATURE = 0.2
# Controls randomness of LLM responses
# 0.0 = deterministic (always same answer)
# 0.5 = balanced (some randomness, mostly consistent)
# 1.0 = very random (different each time)
# For RAG, use LOW temperature (0.1-0.3) so answers are factual and consistent
# For creative tasks, use HIGH temperature (0.7-1.0)
# Default: 0.2 (reliable, slightly varied)

LLM_MAX_TOKENS = 2000
# Maximum tokens (words/pieces) in the LLM's response
# Tokens ≈ words (but not exactly, LLMs count differently)
# 2000 tokens ≈ 1500-2000 words
# Larger values = longer answers (slower)
# Smaller values = shorter answers (faster)
# Good values:
#   - 512 = short answers (1-2 paragraphs)
#   - 1024 = medium answers (2-4 paragraphs)
#   - 2000 = long answers (full pages)
#   - 4096 = very long answers (multiple pages)

# ==================================================================================
# LOGGING SETTINGS - Control what messages are shown
# ==================================================================================

LOG_LEVEL = "INFO"
# What level of logging to show
# Options (from least to most verbose):
#   - "CRITICAL" = only critical errors
#   - "ERROR" = errors only
#   - "WARNING" = warnings and errors
#   - "INFO" = normal operation info (default)
#   - "DEBUG" = detailed debugging info (very verbose)
# Default: INFO (good for normal use)
# Change to DEBUG to troubleshoot issues

# ==================================================================================
# GROUNDING & HALLUCINATION DETECTION SETTINGS
# ==================================================================================

CHECK_GROUNDING = True
# Whether to check if answers are grounded in sources
# True = check every answer (slower but safer)
# False = skip grounding check (faster but risky)
# Default: True (recommended)

GROUNDING_MODEL = LLM_MODEL
# Which model to use for hallucination detection
# By default, uses the same model as LLM_MODEL
# You could use a different model:
#   GROUNDING_MODEL = "mistral"  # Use Mistral for checking
# Or a smaller model for speed:
#   GROUNDING_MODEL = "orca-mini"  # Faster, less accurate

# ==================================================================================
# HELPER FUNCTION - Validate configuration
# ==================================================================================

def validate_config():
    """
    Checks that all configuration values are valid.
    Run this to catch configuration errors before they cause problems.
    """
    
    errors = []
    # List to store any error messages
    
    # Check chunk size and overlap
    if CHUNK_SIZE <= 0:
        errors.append(f"CHUNK_SIZE must be positive, got {CHUNK_SIZE}")
    
    if CHUNK_OVERLAP >= CHUNK_SIZE:
        errors.append(f"CHUNK_OVERLAP ({CHUNK_OVERLAP}) must be less than CHUNK_SIZE ({CHUNK_SIZE})")
    
    # Check retrieval settings
    if TOP_K_RESULTS <= 0:
        errors.append(f"TOP_K_RESULTS must be positive, got {TOP_K_RESULTS}")
    
    # Check temperatures
    if not (0.0 <= LLM_TEMPERATURE <= 2.0):
        errors.append(f"LLM_TEMPERATURE should be 0.0-2.0, got {LLM_TEMPERATURE}")
    
    # Check max tokens
    if LLM_MAX_TOKENS <= 0:
        errors.append(f"LLM_MAX_TOKENS must be positive, got {LLM_MAX_TOKENS}")
    
    # Check API settings
    if API_PORT < 1 or API_PORT > 65535:
        errors.append(f"API_PORT must be 1-65535, got {API_PORT}")
    
    if STREAMLIT_PORT < 1 or STREAMLIT_PORT > 65535:
        errors.append(f"STREAMLIT_PORT must be 1-65535, got {STREAMLIT_PORT}")
    
    # If there are errors, raise an exception
    if errors:
        raise ValueError(
            "Configuration errors:\n" + 
            "\n".join(f"  - {error}" for error in errors)
        )
    
    return True


# ==================================================================================
# MAIN - For testing configuration
# ==================================================================================

if __name__ == "__main__":
    """
    Run this file directly to verify all configuration values:
        python config.py
    """
    
    print("=" * 70)
    print("RAG PIPELINE - CONFIGURATION SUMMARY")
    print("=" * 70)
    print()
    
    print("🌐 OLLAMA & MODELS:")
    print(f"   Base URL: {OLLAMA_BASE_URL}")
    print(f"   LLM Model: {LLM_MODEL}")
    print(f"   Embedding Model: {EMBEDDING_MODEL}")
    print()
    
    print("📁 PATHS:")
    print(f"   Documents: {DOCS_PATH}")
    print(f"   ChromaDB: {CHROMA_DB_PATH}")
    print()
    
    print("✂️  CHUNKING:")
    print(f"   Chunk Size: {CHUNK_SIZE} characters")
    print(f"   Chunk Overlap: {CHUNK_OVERLAP} characters")
    print()
    
    print("🔍 RETRIEVAL:")
    print(f"   Top K Results: {TOP_K_RESULTS}")
    print()
    
    print("🌐 API:")
    print(f"   Host: {API_HOST}")
    print(f"   Port: {API_PORT}")
    print(f"   URL: http://localhost:{API_PORT}")
    print(f"   Timeout: {API_TIMEOUT} seconds")
    print()
    
    print("🎨 STREAMLIT:")
    print(f"   Host: {STREAMLIT_HOST}")
    print(f"   Port: {STREAMLIT_PORT}")
    print(f"   URL: http://localhost:{STREAMLIT_PORT}")
    print()
    
    print("🧠 LLM BEHAVIOR:")
    print(f"   Temperature: {LLM_TEMPERATURE}")
    print(f"   Max Tokens: {LLM_MAX_TOKENS}")
    print()
    
    print("🔬 GROUNDING:")
    print(f"   Check Grounding: {CHECK_GROUNDING}")
    print(f"   Grounding Model: {GROUNDING_MODEL}")
    print()
    
    print("📊 LOGGING:")
    print(f"   Log Level: {LOG_LEVEL}")
    print()
    
    # Validate configuration
    try:
        validate_config()
        print("✅ Configuration is valid!")
    except ValueError as e:
        print(f"❌ Configuration errors:\n{e}")
    
    print()
    print("=" * 70)
