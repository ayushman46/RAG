# ===============================================================
# FILE 1: ingest.py
# ==================================================================================
# PURPOSE: Load documents from my_docs folder, split them into chunks, create
# embeddings using Ollama, and store everything in ChromaDB for retrieval later.
#
# WHY WE DO THIS:
# - RAG systems need a knowledge base to search through
# - We chunk documents so the LLM gets relevant context (not huge documents)
# - We create embeddings (vector representations) so we can search by meaning
# - We store in ChromaDB so we can retrieve similar chunks when answering questions
# ==================================================================================

# IMPORTS - These are libraries we need for this script to work
# ==================================================================================

# LangChain imports - LangChain is a framework for building LLM applications
from langchain_community.document_loaders import DirectoryLoader, PyPDFLoader, TextLoader
# DirectoryLoader: loads all files from a folder
# PyPDFLoader: reads PDF files specifically
# TextLoader: reads .txt files specifically

from langchain_text_splitters import RecursiveCharacterTextSplitter
# RecursiveCharacterTextSplitter: breaks large documents into smaller chunks
# "Recursive" means it tries to keep related sentences together
# "Chunk overlap" means chunks slightly overlap so we don't lose context at boundaries

from langchain_ollama import OllamaEmbeddings
# OllamaEmbeddings: creates vector embeddings using Ollama models
# An embedding is a list of numbers that represents the meaning of text
# Similar texts have similar embeddings, so we can search by similarity

from langchain_chroma import Chroma
# Chroma: a vector database that stores embeddings and allows similarity search
# "Vector database" means it stores numbers (embeddings) not just text

# Standard Python imports
import os
# os: allows us to interact with the operating system (check if folders exist, etc)

from pathlib import Path
# Path: a modern way to work with file paths that works on Mac, Windows, Linux

# Import configuration from config.py
from config import (
    DOCS_PATH,
    CHROMA_DB_PATH,
    CHUNK_SIZE,
    CHUNK_OVERLAP,
    OLLAMA_BASE_URL,
    EMBEDDING_MODEL,
    LOG_LEVEL,
    validate_config
)
# Import all configuration values from config.py
# This way, we use the same settings everywhere
# If you need to change a value, edit config.py instead of this file

# ==================================================================================
# FUNCTION 1: load_documents()
# ==================================================================================
# PURPOSE: Load all .txt and .pdf files from the my_docs folder
# WHY: We need to read the documents before we can chunk and embed them
# ==================================================================================

def load_documents():
    """
    Load all .txt and .pdf files from the DOCS_PATH using LangChain.
    
    Returns:
        list: A list of Document objects (each has .page_content and .metadata)
        Returns empty list if folder doesn't exist or has no documents.
    """
    
    # Check if the docs folder exists
    if not os.path.exists(DOCS_PATH):
        print(f"❌ ERROR: Folder '{DOCS_PATH}' does not exist!")
        print(f"   Please create a folder called 'my_docs' and add .txt or .pdf files to it.")
        return []
    
    # Tell the user we are starting to load documents
    print(f"\n📂 Loading documents from: {DOCS_PATH}")
    
    documents = []
    
    # Use DirectoryLoader to load all files from the folder
    # This loader can handle multiple file types
    loader = DirectoryLoader(
        path=DOCS_PATH,
        # glob pattern: "**/*.txt" means "any .txt file in any subfolder"
        glob="**/*.txt",
        # Tell the loader to use TextLoader for .txt files
        loader_cls=TextLoader,
        # Silently skip files that can't be read (encoding issues, etc)
        silent_errors=True,
        # Recursively search subfolders too
        recursive=True
    )
    
    # Load all .txt files
    txt_documents = loader.load()
    documents.extend(txt_documents)
    
    # Do the same for PDF files
    pdf_loader = DirectoryLoader(
        path=DOCS_PATH,
        glob="**/*.pdf",
        loader_cls=PyPDFLoader,
        silent_errors=True,
        recursive=True
    )
    
    # Load all .pdf files
    pdf_documents = pdf_loader.load()
    documents.extend(pdf_documents)
    
    # Tell the user how many documents we loaded
    print(f"✅ Loaded {len(documents)} documents")
    
    # If we didn't load any documents, give the user helpful feedback
    if len(documents) == 0:
        print(f"⚠️  No .txt or .pdf files found in {DOCS_PATH}")
        print(f"   Please add some documents to continue!")
    
    # Return the list of documents
    return documents


# ==================================================================================
# FUNCTION 2: chunk_documents()
# ==================================================================================
# PURPOSE: Break large documents into smaller chunks
# WHY: The LLM gets better results if we give it relevant context chunks
#      instead of throwing huge documents at it
# ==================================================================================

def chunk_documents(documents):
    """
    Split documents into smaller chunks with overlap.
    
    Args:
        documents: List of Document objects from load_documents()
    
    Returns:
        list: List of chunked Document objects
    """
    
    # If we have no documents, return empty list
    if not documents:
        print("⚠️  No documents to chunk")
        return []
    
    print(f"\n✂️  Chunking {len(documents)} documents...")
    
    # Create the text splitter that will break documents into chunks
    splitter = RecursiveCharacterTextSplitter(
        # CHUNK_SIZE: how many characters in each chunk
        # Smaller chunks = more specific but more chunks to search
        # Larger chunks = less chunks but less specific
        # 512 is a good balance for most use cases
        chunk_size=CHUNK_SIZE,
        
        # CHUNK_OVERLAP: how many characters overlap between chunks
        # Overlap prevents losing context at chunk boundaries
        # If chunk 1 ends with "The cat jumped", and chunk 2 starts with "jumped over",
        # we don't lose "jumped" even if it falls on the boundary
        chunk_overlap=CHUNK_OVERLAP,
        
        # length_function: how to measure "length" (default is len = count characters)
        length_function=len,
        
        # separators: what to split on, in order of preference
        # First try to split on "\n\n" (paragraph breaks)
        # Then "\n" (line breaks)
        # Then " " (spaces)
        # Finally split character by character if needed
        separators=["\n\n", "\n", " ", ""],
        
        # is_separator_regex: whether separators are regex patterns (we're not using regex)
        is_separator_regex=False,
    )
    
    # Split all documents into chunks
    chunks = splitter.split_documents(documents)
    
    # Tell the user the results
    print(f"✅ Created {len(chunks)} chunks")
    print(f"   Average chunk size: {sum(len(chunk.page_content) for chunk in chunks) // len(chunks)} characters")
    
    return chunks


# ==================================================================================
# FUNCTION 3: create_embeddings_and_store()
# ==================================================================================
# PURPOSE: Create embeddings for each chunk and store in ChromaDB
# WHY: Embeddings are how the system finds relevant chunks when answering questions
#      By storing them in ChromaDB, we can quickly search for similar chunks
# ==================================================================================

def create_embeddings_and_store(chunks):
    """
    Create embeddings for each chunk and store in ChromaDB.
    
    Args:
        chunks: List of Document objects from chunk_documents()
    
    Returns:
        Chroma vector database object
    """
    
    if not chunks:
        print("⚠️  No chunks to embed and store")
        return None
    
    print(f"\n🔢 Creating embeddings for {len(chunks)} chunks...")
    print(f"   Using Ollama model: {EMBEDDING_MODEL}")
    print(f"   Connecting to: {OLLAMA_BASE_URL}")
    
    # Create an OllamaEmbeddings object that will talk to Ollama
    embeddings = OllamaEmbeddings(
        # The model to use for creating embeddings
        model=EMBEDDING_MODEL,
        
        # The URL where Ollama is running
        base_url=OLLAMA_BASE_URL,
    )
    # Note: The embeddings object doesn't actually create embeddings yet,
    # it just sets up the configuration. The embeddings are created when we
    # call Chroma.from_documents() below.
    
    # Create and store embeddings in ChromaDB
    # This does the heavy lifting: for each chunk, it:
    # 1. Sends the chunk text to Ollama
    # 2. Gets back a vector (embedding) representing that text
    # 3. Stores the vector and original text in ChromaDB
    vectordb = Chroma.from_documents(
        # The chunks to embed and store
        documents=chunks,
        
        # The embeddings object we created above
        embedding=embeddings,
        
        # Where to save the ChromaDB database on disk
        # This way it persists between runs
        persist_directory=CHROMA_DB_PATH,
        
        # The collection name (think of it like a table in a database)
        collection_name="rag_documents"
    )
    
    print(f"✅ Embeddings created and stored in ChromaDB")
    print(f"   Database location: {CHROMA_DB_PATH}")
    print(f"   Collection: rag_documents")
    
    return vectordb


# ==================================================================================
# FUNCTION 4: main()
# ==================================================================================
# PURPOSE: Orchestrate the entire ingestion pipeline
# WHY: We organize our code into a main() function so it's clean and reusable
# ==================================================================================

def main():
    """
    Run the complete ingestion pipeline: load → chunk → embed → store.
    """
    
    print("\n" + "="*80)
    print("RAG PIPELINE: DOCUMENT INGESTION")
    print("="*80)
    
    # First, validate that all configuration values are correct
    print("\n🔍 Validating configuration...")
    try:
        validate_config()
        print("✅ Configuration is valid!")
    except ValueError as e:
        print(f"❌ Configuration error: {e}")
        return False
    
    # Step 1: Load documents from the my_docs folder
    print("\n" + "-"*80)
    print("STEP 1: Loading Documents")
    print("-"*80)
    documents = load_documents()
    
    if not documents:
        print("❌ No documents loaded. Cannot continue.")
        return False
    
    # Step 2: Split documents into chunks
    print("\n" + "-"*80)
    print("STEP 2: Chunking Documents")
    print("-"*80)
    chunks = chunk_documents(documents)
    
    if not chunks:
        print("❌ No chunks created. Cannot continue.")
        return False
    
    # Step 3: Create embeddings and store in ChromaDB
    print("\n" + "-"*80)
    print("STEP 3: Creating Embeddings and Storing in ChromaDB")
    print("-"*80)
    vectordb = create_embeddings_and_store(chunks)
    
    if vectordb is None:
        print("❌ Failed to create embeddings and store in ChromaDB")
        return False
    
    # Success! Tell the user everything worked
    print("\n" + "="*80)
    print("✅ INGESTION PIPELINE COMPLETE!")
    print("="*80)
    print(f"\n📊 Summary:")
    print(f"   • Documents loaded: {len(documents)}")
    print(f"   • Chunks created: {len(chunks)}")
    print(f"   • Embeddings stored: {len(chunks)}")
    print(f"   • Database location: {CHROMA_DB_PATH}")
    print(f"\n💡 Next steps:")
    print(f"   1. Start the API: python api.py")
    print(f"   2. Start the UI: streamlit run app.py")
    print(f"   3. Ask questions about your documents!")
    
    return True


# ==================================================================================
# RUN THE SCRIPT
# ==================================================================================
# This is the standard Python pattern: only run main() if this file is executed
# directly, not if it's imported as a module by another file

if __name__ == "__main__":
    success = main()
    
    # Exit with appropriate status code
    # 0 = success, 1 = failure
    # This is useful if you're running this from a shell script or CI/CD pipeline
    exit(0 if success else 1)
