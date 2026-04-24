# ==================================================================================
# FILE 3: app.py
# ==================================================================================
# PURPOSE: Streamlit user interface for the RAG pipeline.
#
# This is the frontend that users interact with. It displays a chat-like interface
# where users can ask questions about their documents and get answers with sources.
#
# WHY WE DO THIS:
# - Streamlit makes it easy to build interactive web UIs with just Python
# - No HTML/CSS/JavaScript needed - just Python code
# - It automatically handles the browser, server, and user interactions
# - The UI runs on http://localhost:8501 and calls the FastAPI backend at :8000
# ==================================================================================

# IMPORTS - Libraries we need for this Streamlit app
# ==================================================================================

import streamlit as st
# Streamlit: framework for building interactive web apps with Python
# st.write(), st.button(), st.text_input(), etc are all Streamlit functions

import requests
# requests: library for making HTTP requests to our FastAPI backend
# We use this to send questions to api.py and get answers back

import json
# json: for parsing JSON responses from the API
# (though requests handles this automatically with .json())

from datetime import datetime
# datetime: for showing timestamps (optional, for nice formatting)

import time
# time: for measuring how long API calls take

# Import configuration from config.py
from config import API_PORT, API_TIMEOUT, validate_config
# Import configuration values from config.py
# This way, we use the same settings everywhere

# ==================================================================================
# PAGE CONFIGURATION - Set up the Streamlit page
# ==================================================================================

st.set_page_config(
    page_title="RAG Pipeline — Ask Your Documents",
    # Title shown in the browser tab
    
    page_icon="📚",
    # Emoji icon shown in the browser tab
    
    layout="wide",
    # "wide" layout makes better use of screen space
    # "centered" is another option
    
    initial_sidebar_state="expanded",
    # Start with the sidebar expanded (user can collapse it)
)

# ==================================================================================
# CONSTANTS - Configuration values
# ==================================================================================

API_BASE_URL = f"http://localhost:{API_PORT}"
# Where the FastAPI backend is running
# Built dynamically from config.API_PORT

API_HEALTH_ENDPOINT = f"{API_BASE_URL}/health"
# Health check endpoint - returns {"status": "ok"}

API_ASK_ENDPOINT = f"{API_BASE_URL}/ask"
# Main endpoint - POST a question here

REQUEST_TIMEOUT = API_TIMEOUT
# How long to wait for API response (in seconds)
# Imported from config.py for consistency

# ==================================================================================
# SESSION STATE - Variables that persist across page reloads
# ==================================================================================

# Streamlit reruns the entire script every time the user interacts with it
# To persist variables (like chat history), we use st.session_state

if "chat_history" not in st.session_state:
    # If chat_history doesn't exist yet, create it
    st.session_state.chat_history = []
    # chat_history is a list of dicts like:
    # [
    #   {"role": "user", "question": "...", "timestamp": "..."},
    #   {"role": "assistant", "answer": "...", "sources": [...], "grounded": bool}
    # ]

if "api_status" not in st.session_state:
    # Track whether the API is online
    st.session_state.api_status = None
    # None = unknown, True = online, False = offline

# ==================================================================================
# UTILITY FUNCTIONS
# ==================================================================================

def check_api_health():
    """
    Check if the FastAPI backend is running and responsive.
    
    Returns:
        bool: True if API is online, False if offline
    """
    try:
        response = requests.get(
            API_HEALTH_ENDPOINT,
            # GET request to /health
            
            timeout=5,
            # Wait max 5 seconds for response
        )
        
        # If we get here, the API responded
        return response.status_code == 200
        # Return True only if status is 200 (OK)
        
    except requests.exceptions.ConnectionError:
        # API is not running or not reachable
        return False
    except Exception as e:
        # Any other error (timeout, network issue, etc)
        return False


def ask_question(question):
    """
    Send a question to the FastAPI backend and get an answer.
    
    Args:
        question (str): The user's question
    
    Returns:
        dict or None: Response from API, or None if request failed
        Response dict contains: answer, grounded, verdict, sources, question
    """
    
    try:
        # Prepare the request body
        payload = {
            "question": question
            # The question to ask
        }
        
        # Send POST request to /ask endpoint
        response = requests.post(
            API_ASK_ENDPOINT,
            # POST to /ask
            
            json=payload,
            # Send the payload as JSON
            
            timeout=REQUEST_TIMEOUT,
            # Wait max 30 seconds for response
        )
        
        if response.status_code == 200:
            # If we got a 200 response, parse and return the JSON
            return response.json()
            # .json() automatically parses JSON response into a dict
            
        else:
            # API returned an error status code (400, 500, etc)
            error_detail = response.json().get("detail", "Unknown error")
            # Try to get the error message from the response
            
            st.error(f"❌ API Error: {error_detail}")
            # Show error to user
            
            return None
            
    except requests.exceptions.Timeout:
        # The API took too long to respond
        st.error("❌ Request timed out. The LLM is taking too long to respond. Try a simpler question.")
        return None
        
    except requests.exceptions.ConnectionError:
        # Can't connect to the API
        st.error(f"❌ Cannot connect to API at {API_BASE_URL}")
        st.info("Make sure to run: `uvicorn api:app --reload` in another terminal")
        return None
        
    except Exception as e:
        # Any other unexpected error
        st.error(f"❌ Error: {str(e)}")
        return None


def format_sources(sources):
    """
    Format source documents nicely for display.
    
    Args:
        sources (list): List of source dicts from API response
    
    Returns:
        str: Formatted HTML string for display
    """
    
    if not sources:
        # If no sources, return empty string
        return "No sources"
    
    # Build a formatted string showing each source
    formatted = ""
    for i, source in enumerate(sources, 1):
        # i starts at 1 (not 0), source is a dict with "content" and "metadata"
        
        content = source.get("content", "")
        # Get the text of this chunk
        
        metadata = source.get("metadata", {})
        # Get metadata (like filename)
        
        source_file = metadata.get("source", "Unknown")
        # Get the filename from metadata
        
        # Truncate long content to first 200 characters
        preview = content[:200] + "..." if len(content) > 200 else content
        
        # Build a nice formatted string
        formatted += f"""
**📄 Source {i}: {source_file}**
```
{preview}
```
"""
    
    return formatted


# ==================================================================================
# SIDEBAR - Configuration panel on the left
# ==================================================================================

with st.sidebar:
    # Everything in this "with" block goes in the sidebar
    
    st.title("📚 RAG Pipeline Settings")
    
    # Show API status
    st.subheader("🌐 API Status")
    
    # Check API health
    api_online = check_api_health()
    # api_online is True or False
    
    if api_online:
        # API is online
        st.success("✅ API is online")
        # Green success message
        
    else:
        # API is offline
        st.error("❌ API is offline")
        # Red error message
        
        st.warning("""
        The FastAPI backend is not running!
        
        To start it, open a new terminal and run:
        ```
        cd ~/rag-pipeline
        source .venv/bin/activate
        uvicorn api:app --reload
        ```
        """)
        # Show instructions for starting the API
    
    st.divider()
    # Draw a horizontal line
    
    # Show model information
    st.subheader("🧠 Model Information")
    st.write("""
    **LLM Model:** llama3.2
    - Runs locally via Ollama
    - Fast and accurate
    - No API key required
    
    **Embedding Model:** nomic-embed-text
    - Converts text to vectors
    - Used for similarity search
    - Runs locally via Ollama
    """)
    
    st.divider()
    
    # Show instructions
    st.subheader("💡 How to Use")
    st.write("""
    1. **Add documents** - Put .txt or .pdf files in the `my_docs/` folder
    2. **Index them** - Run `python ingest.py` to chunk and embed them
    3. **Ask questions** - Type your question below
    4. **Get answers** - The LLM will search your documents for relevant info
    5. **Check sources** - See which document chunks were used
    6. **Check grounding** - See if the answer is supported by sources
    """)
    
    st.divider()
    
    # Clear chat history button
    st.subheader("🧹 Chat History")
    
    if st.button("Clear Chat History"):
        # When user clicks this button
        st.session_state.chat_history = []
        # Clear the chat history
        
        st.success("✅ Chat history cleared!")
        # Show confirmation
        
        st.rerun()
        # Rerun the app to show the empty chat


# ==================================================================================
# MAIN CONTENT - The chat interface
# ==================================================================================

st.title("💬 Ask Your Documents")
# Page title

st.write("""
This RAG (Retrieval-Augmented Generation) pipeline lets you ask questions about
your documents. The AI searches your documents for relevant information and generates
answers. You can see which documents were used and whether the answer is grounded
in your sources.
""")

st.divider()

# ==================================================================================
# INPUT SECTION - Where user types their question
# ==================================================================================

# Create two columns: one for input, one for button
col1, col2 = st.columns([4, 1])
# [4, 1] means the first column is 4 times wider than the second

with col1:
    # First column: text input
    user_question = st.text_input(
        "Enter your question:",
        # Label shown above the input box
        
        placeholder="e.g., What is machine learning?",
        # Placeholder text shown inside the empty box
        
        key="question_input",
        # Unique identifier for this input
    )

with col2:
    # Second column: search button
    search_button = st.button(
        "🔍 Search",
        # Button label
        
        use_container_width=True,
        # Make button fill the column width
    )

st.divider()

# ==================================================================================
# PROCESSING - When user clicks the search button
# ==================================================================================

if search_button and user_question:
    # If user clicked search AND typed a question
    
    if not check_api_health():
        # Check if API is online first
        st.error("❌ API is not running! Please start the FastAPI backend first.")
        st.stop()
        # Stop execution here
    
    # Show a loading spinner while waiting for the API
    with st.spinner("⏳ Searching documents and generating answer..."):
        # Everything inside this block shows a spinner
        
        start_time = time.time()
        # Record when we started the request
        
        response = ask_question(user_question)
        # Send the question to the API and get response
        
        elapsed_time = time.time() - start_time
        # Calculate how long it took
    
    if response:
        # If we got a valid response from the API
        
        # Add to chat history
        st.session_state.chat_history.append({
            "type": "user",
            "question": user_question,
            "timestamp": datetime.now().strftime("%H:%M:%S")
            # Store the question with timestamp
        })
        
        st.session_state.chat_history.append({
            "type": "assistant",
            "answer": response["answer"],
            "grounded": response["grounded"],
            "verdict": response["verdict"],
            "sources": response.get("sources", []),
            "timestamp": datetime.now().strftime("%H:%M:%S")
            # Store the answer with all details
        })
        
        # Show the answer
        st.subheader("✅ Answer")
        
        st.write(response["answer"])
        # Display the answer text
        
        # Show grounding status with badge
        st.subheader("🔬 Hallucination Check")
        
        if response["grounded"]:
            # Answer is grounded (good)
            st.success(f"✅ Grounded: {response['verdict']}")
            # Green badge
        else:
            # Answer might be hallucinated (warning)
            st.warning(f"⚠️  Not Grounded: {response['verdict']}")
            # Yellow badge
        
        # Show sources used
        st.subheader("📚 Source Documents")
        
        if response.get("sources"):
            # If there are sources
            
            with st.expander(f"📖 Show {len(response['sources'])} source document(s)", expanded=True):
                # Create an expandable section
                # expanded=True means it starts open
                
                for i, source in enumerate(response["sources"], 1):
                    # Loop through each source
                    
                    st.markdown(f"### 📄 Source {i}")
                    # Show source number
                    
                    st.write(source["content"])
                    # Show the chunk text
                    
                    if source.get("metadata"):
                        # If there's metadata
                        st.caption(f"📁 From: {source['metadata'].get('source', 'Unknown')}")
                        # Show filename
        else:
            st.info("ℹ️  No sources were used to generate this answer.")
        
        # Show response time
        st.caption(f"⏱️  Response time: {elapsed_time:.2f} seconds")
        # Show how long the whole thing took

elif search_button and not user_question:
    # User clicked search but didn't type a question
    st.warning("⚠️  Please enter a question first!")

st.divider()

# ==================================================================================
# CHAT HISTORY DISPLAY - Show all previous Q&A
# ==================================================================================

if st.session_state.chat_history:
    # If there's any chat history to show
    
    st.subheader("💬 Chat History")
    
    # Display chat history in reverse order (most recent first)
    for item in reversed(st.session_state.chat_history):
        
        if item["type"] == "user":
            # This is a user question
            
            with st.chat_message("user"):
                # Use Streamlit's chat bubble styling for user messages
                
                st.write(f"**{item['question']}**")
                # Show the question in bold
                
                st.caption(f"Asked at {item['timestamp']}")
                # Show when it was asked
        
        elif item["type"] == "assistant":
            # This is an AI answer
            
            with st.chat_message("assistant"):
                # Use Streamlit's chat bubble styling for assistant messages
                
                st.write(item["answer"])
                # Show the answer
                
                # Show grounding status
                if item["grounded"]:
                    st.success(f"✅ Grounded")
                else:
                    st.warning(f"⚠️  Potential hallucination")
                
                # Show timestamp
                st.caption(f"Answered at {item['timestamp']}")

else:
    # No chat history yet
    st.info("💭 No questions yet. Ask something about your documents!")

# ==================================================================================
# FOOTER - Show helpful info at bottom
# ==================================================================================

st.divider()

st.markdown("""
---
### 📖 About This RAG Pipeline

**RAG** stands for **Retrieval-Augmented Generation**. It works like this:

1. **You ask a question** → sent to the AI backend
2. **Search your documents** → ChromaDB finds relevant chunks using embeddings
3. **Generate answer** → llama3.2 creates an answer using the found chunks
4. **Check if grounded** → verify the answer actually comes from your docs
5. **Return everything** → answer, sources, and grounding status

**Why RAG?**
- Answers are based on YOUR documents, not general knowledge
- You can verify sources
- Hallucinations are reduced (though not eliminated)
- Costs less than calling external APIs

---
""")

# ==================================================================================
# HOW TO RUN THIS FILE:
# ==================================================================================
#
# Make sure the FastAPI backend (api.py) is running first:
#   In Terminal 1:
#     cd /Users/ayush/Downloads/rag-pipeline
#     source .venv/bin/activate
#     uvicorn api:app --reload
#
# Then in another terminal:
#   In Terminal 2:
#     cd /Users/ayush/Downloads/rag-pipeline
#     source .venv/bin/activate
#     streamlit run app.py
#
# The Streamlit UI will open automatically at:
#   http://localhost:8501
#
# You should see:
#   ✓ Page title: "RAG Pipeline — Ask Your Documents"
#   ✓ Sidebar with API status, model info, instructions, and clear button
#   ✓ Main chat interface with question input
#   ✓ Responses with answers, sources, and grounding status
#
# ==================================================================================
