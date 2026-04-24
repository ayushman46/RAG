# ==================================================================================
# FILE 4: hallucination.py
# ==================================================================================
# PURPOSE: Detect hallucinations in LLM-generated answers by checking if they
# are grounded in the source documents.
#
# WHAT IS A HALLUCINATION?
# A hallucination happens when an LLM generates plausible-sounding information
# that is NOT actually in the source documents. For example:
#   - Answer: "Machine learning was invented in 1985"
#   - Reality: The document doesn't mention 1985
#   - This is a hallucination!
#
# WHY WE CHECK:
# - LLMs can be very confident about wrong things
# - RAG should only answer based on your documents
# - Users need to know if the answer is trustworthy
# - We check by asking another LLM: "Is this answer in these documents?"
#
# HOW IT WORKS:
# 1. We take the LLM's answer and the source documents
# 2. We create a grounding prompt asking: "Is every claim supported?"
# 3. We send this to the LLM to check
# 4. The LLM responds YES or NO with an explanation
# 5. We parse the response and return grounding status
# ==================================================================================

# IMPORTS - Libraries we need
# ==================================================================================

# We need the LLM to do the grounding check
# Note: The LLM is passed in by api.py, so we don't create a new one here
# We just use whatever LLM is passed to our functions

# Standard Python imports
from typing import Tuple, List
# typing: for type hints (tell Python what types variables should be)
# Tuple: a list of fixed length, e.g., (bool, str)
# List: a variable-length list


# ==================================================================================
# FUNCTION 1: check_grounding()
# ==================================================================================
# PURPOSE: Verify that an answer is grounded in source documents
#
# WHY THIS IS IMPORTANT:
# - This is THE key function that detects hallucinations
# - It uses the LLM to verify the LLM's own answer
# - This is called "self-critique" - the model checks itself
# - Much more reliable than just trusting the first answer
# ==================================================================================

def check_grounding(answer: str, source_chunks: List[str], llm) -> Tuple[bool, str]:
    """
    Check if an LLM-generated answer is grounded in source documents.
    
    The function works by:
    1. Creating a prompt that shows the source chunks and the answer
    2. Asking an LLM: "Is every factual claim in this answer supported by these sources?"
    3. Parsing the LLM response to determine if grounded (YES) or hallucinated (NO)
    
    Args:
        answer (str): The LLM's generated answer to check
        source_chunks (List[str]): List of source document texts that were used
        llm: The language model instance (e.g., OllamaLLM)
           Could be the same LLM or a different one
    
    Returns:
        Tuple[bool, str]: 
            - bool: True if answer is grounded, False if potential hallucination
            - str: Explanation/verdict from the LLM (e.g., "All claims are supported")
    """
    
    # Sanity checks - make sure we have valid inputs
    if not answer or not answer.strip():
        # If answer is empty or just whitespace
        return False, "Answer is empty - cannot ground an empty answer"
    
    if not source_chunks or len(source_chunks) == 0:
        # If we have no source documents
        return False, "No source documents provided - cannot verify without sources"
    
    # Create the grounding check prompt
    # This prompt asks the LLM to verify the answer against sources
    
    grounding_prompt = f"""
You are a fact-checker. Your job is to verify that an answer is grounded in source documents.

INSTRUCTIONS:
1. Read the source documents carefully
2. Read the answer carefully
3. Check if EVERY factual claim in the answer is directly supported by the sources
4. Look for:
   - Specific facts (dates, numbers, names) - these must be in sources
   - General statements - these should be supported by the overall meaning
   - Inferences - these should be logical conclusions from the sources
5. Respond with ONLY "YES" or "NO" on the first line
6. On the second line, provide a brief explanation (1-2 sentences max)

DO NOT say "I cannot verify" or "not mentioned". If it's not in the sources, that's a NO.

SOURCE DOCUMENTS:
{format_sources_for_prompt(source_chunks)}

ANSWER TO CHECK:
{answer}

RESPONSE (start with YES or NO):
""".strip()
    
    # Send the prompt to the LLM
    try:
        # Call the LLM with the grounding prompt
        response = llm.invoke(grounding_prompt)
        # response is the LLM's text response
        
        # Parse the response to extract YES/NO
        is_grounded, verdict = parse_grounding_response(response)
        # parse_grounding_response() extracts the YES/NO and explanation
        
        return is_grounded, verdict
        # Return the grounding status and explanation
        
    except Exception as e:
        # If something goes wrong calling the LLM
        # Better to be conservative - assume not grounded if we can't verify
        error_msg = f"Error checking grounding: {str(e)}"
        return False, error_msg


# ==================================================================================
# HELPER FUNCTION 1: format_sources_for_prompt()
# ==================================================================================
# PURPOSE: Format source documents nicely for the LLM to read
# ==================================================================================

def format_sources_for_prompt(source_chunks: List[str]) -> str:
    """
    Format a list of source chunks for display in the prompt.
    
    Args:
        source_chunks (List[str]): List of source document texts
    
    Returns:
        str: Nicely formatted string with all sources numbered and separated
    """
    
    if not source_chunks:
        # If no chunks, return empty string
        return "[No source documents]"
    
    # Build a formatted string with each source numbered
    formatted = ""
    
    for i, chunk in enumerate(source_chunks, 1):
        # i starts at 1 (not 0), chunk is each piece of text
        
        # Add a heading for this chunk
        formatted += f"\n--- Source {i} ---\n"
        
        # Add the chunk text
        formatted += chunk.strip()
        # .strip() removes leading/trailing whitespace
        
        # Add extra newline between chunks for readability
        formatted += "\n"
    
    return formatted


# ==================================================================================
# HELPER FUNCTION 2: parse_grounding_response()
# ==================================================================================
# PURPOSE: Extract YES/NO and explanation from LLM's grounding response
# ==================================================================================

def parse_grounding_response(response: str) -> Tuple[bool, str]:
    """
    Parse the LLM's grounding check response.
    
    The LLM should respond with:
      YES
      [explanation]
    
    Or:
      NO
      [explanation]
    
    We extract the YES/NO and the explanation.
    
    Args:
        response (str): The LLM's response text
    
    Returns:
        Tuple[bool, str]:
            - bool: True if response starts with "YES", False if "NO"
            - str: The explanation (everything after the first line)
    """
    
    if not response:
        # If empty response
        return False, "No response from grounding check"
    
    # Split response into lines
    lines = response.strip().split("\n")
    # .strip() removes leading/trailing whitespace
    # .split("\n") splits by newline into a list
    
    if len(lines) == 0:
        # If no lines (shouldn't happen after strip/split)
        return False, "Invalid response format"
    
    # Get the first line and convert to uppercase for comparison
    first_line = lines[0].strip().upper()
    # .upper() converts to uppercase so "yes", "YES", "Yes" all match
    
    # Get the explanation (everything after the first line, joined together)
    explanation_lines = lines[1:] if len(lines) > 1 else []
    # Take all lines after the first one
    
    explanation = " ".join([line.strip() for line in explanation_lines])
    # Join all explanation lines into one string
    
    # If explanation is empty, use a default message
    if not explanation:
        explanation = "Grounding check completed"
    
    # Check if response starts with YES or NO
    if "YES" in first_line:
        # Response contains YES (at any position)
        return True, explanation
        # Return: grounded=True, with the explanation
    
    elif "NO" in first_line:
        # Response contains NO
        return False, explanation
        # Return: not grounded=False, with the explanation
    
    else:
        # Response doesn't clearly say YES or NO
        # This is ambiguous, so be conservative and assume not grounded
        return False, f"Unclear response: {first_line}. {explanation}"
        # Return: not grounded, with the original response as explanation


# ==================================================================================
# FUNCTION 2: extract_citations()
# ==================================================================================
# PURPOSE: Identify which specific source chunks support each claim
#
# WHY THIS IS USEFUL:
# - Shows the user exactly where each piece of the answer comes from
# - More transparent than just showing all sources
# - Helps user understand the reasoning
# - Can be used to highlight specific quotes
# ==================================================================================

def extract_citations(answer: str, source_chunks: List[str], llm) -> List[str]:
    """
    Extract citations showing which source chunks support each claim in the answer.
    
    The function works by:
    1. Creating a prompt that asks the LLM to map claims to sources
    2. The LLM identifies which source(s) support each sentence/claim
    3. We return a list of citations with format: "Claim: [source excerpt]"
    
    Args:
        answer (str): The generated answer
        source_chunks (List[str]): List of source document texts
        llm: The language model instance
    
    Returns:
        List[str]: List of citation strings, one per major claim in the answer
                  Format: "Claim X is supported by: [relevant excerpt]"
    """
    
    # Validation
    if not answer or not answer.strip():
        # If no answer
        return []
    
    if not source_chunks:
        # If no sources
        return []
    
    # Create the citation extraction prompt
    citation_prompt = f"""
You are a citation expert. Your job is to map claims in an answer to specific source excerpts.

INSTRUCTIONS:
1. Read the answer carefully
2. Identify each major claim (usually one per sentence)
3. For each claim, find the source excerpt that supports it
4. Format each citation as: "Claim: [exact quote from sources]"
5. If a claim is not in sources, write "Claim: [NOT FOUND IN SOURCES]"
6. List all citations, one per line

SOURCES:
{format_sources_for_prompt(source_chunks)}

ANSWER:
{answer}

CITATIONS (one per line, "Claim: [excerpt]" format):
""".strip()
    
    try:
        # Call the LLM to extract citations
        response = llm.invoke(citation_prompt)
        # response is the LLM's list of citations
        
        # Parse the citations
        citations = parse_citation_response(response)
        # parse_citation_response() extracts the individual citations
        
        return citations
        # Return list of citations
        
    except Exception as e:
        # If something goes wrong
        return []
        # Return empty list rather than crashing


# ==================================================================================
# HELPER FUNCTION 3: parse_citation_response()
# ==================================================================================
# PURPOSE: Extract individual citations from the LLM's response
# ==================================================================================

def parse_citation_response(response: str) -> List[str]:
    """
    Parse the LLM's citation response into a list of individual citations.
    
    Args:
        response (str): The LLM's response containing multiple citations
    
    Returns:
        List[str]: List of citation strings (one per claim)
    """
    
    if not response:
        # If empty response
        return []
    
    # Split response into lines
    lines = response.strip().split("\n")
    
    # Filter out empty lines and return
    citations = [line.strip() for line in lines if line.strip()]
    # List comprehension: keep only non-empty lines
    
    # Filter to keep only lines that look like citations
    # Citations should have format "...: ..."
    citations = [c for c in citations if ":" in c]
    
    return citations
    # Return the list of citations


# ==================================================================================
# FUNCTION 3: get_grounding_score()
# ==================================================================================
# PURPOSE: Get a numeric score (0-100) of how grounded an answer is
#
# OPTIONAL FUNCTION - Not used by api.py but useful for ranking answers
# ==================================================================================

def get_grounding_score(answer: str, source_chunks: List[str], llm) -> float:
    """
    Get a numeric grounding score (0-100) for an answer.
    
    Score interpretation:
    - 90-100: Very well grounded, all claims supported
    - 70-89:  Generally grounded, mostly supported
    - 50-69:  Partially grounded, some unsupported claims
    - 0-49:   Poorly grounded, many unsupported claims
    
    Args:
        answer (str): The generated answer
        source_chunks (List[str]): List of source documents
        llm: The language model instance
    
    Returns:
        float: A score from 0.0 to 100.0
    """
    
    if not answer or not source_chunks:
        # If invalid inputs
        return 0.0
    
    # Create a prompt that asks the LLM for a grounding score
    scoring_prompt = f"""
You are a grounding evaluator. Rate how well an answer is grounded in sources (0-100).

Scoring guide:
- 90-100: All claims directly supported by sources
- 70-89:  Most claims supported, minor unsupported details
- 50-69:  Some claims supported, some not
- 0-49:   Few claims supported, mostly unsupported

SOURCES:
{format_sources_for_prompt(source_chunks)}

ANSWER:
{answer}

Respond with ONLY a number from 0 to 100:
""".strip()
    
    try:
        # Call the LLM
        response = llm.invoke(scoring_prompt)
        # response might be "85" or "85.5" or "score: 85", etc
        
        # Extract the number from the response
        score = extract_score_from_response(response)
        
        return score
        # Return the score (0-100)
        
    except Exception as e:
        # If something goes wrong, return 0
        return 0.0


# ==================================================================================
# HELPER FUNCTION 4: extract_score_from_response()
# ==================================================================================
# PURPOSE: Extract a numeric score from the LLM's response
# ==================================================================================

def extract_score_from_response(response: str) -> float:
    """
    Extract a numeric score (0-100) from a string response.
    
    Handles cases like:
    - "85"
    - "85.5"
    - "score: 85"
    - "The score is 85 out of 100"
    
    Args:
        response (str): The LLM's response
    
    Returns:
        float: The extracted score (0-100), or 0 if parsing fails
    """
    
    if not response:
        return 0.0
    
    # Convert to string and clean up
    response = str(response).strip()
    
    try:
        # Try to find all numbers in the response
        import re
        # re: regular expressions for pattern matching
        
        # Find all sequences of digits (with optional decimal point)
        numbers = re.findall(r'\d+\.?\d*', response)
        # \d+ means one or more digits
        # \.? means optional decimal point
        # \d* means zero or more digits after decimal
        
        if numbers:
            # If we found at least one number
            score = float(numbers[0])
            # Take the first number
            
            # Clamp to 0-100 range
            score = max(0.0, min(100.0, score))
            # Make sure it's between 0 and 100
            
            return score
        
    except Exception as e:
        # If parsing fails
        pass
    
    # If we couldn't extract a number, return 0
    return 0.0


# ==================================================================================
# MAIN - For testing this module standalone
# ==================================================================================

if __name__ == "__main__":
    """
    This code runs if you execute this file directly: python hallucination.py
    It's useful for testing the hallucination detection functions.
    """
    
    print("=" * 70)
    print("hallucination.py - Hallucination Detection Module")
    print("=" * 70)
    print()
    print("This module is meant to be imported by api.py")
    print("Functions provided:")
    print()
    print("1. check_grounding(answer, source_chunks, llm)")
    print("   - Checks if answer is grounded in sources")
    print("   - Returns: (is_grounded: bool, verdict: str)")
    print()
    print("2. extract_citations(answer, source_chunks, llm)")
    print("   - Maps claims to source excerpts")
    print("   - Returns: List[str] of citations")
    print()
    print("3. get_grounding_score(answer, source_chunks, llm)")
    print("   - Gets numeric grounding score (0-100)")
    print("   - Returns: float score")
    print()
    print("=" * 70)
    print()
    print("To use in api.py:")
    print("  from hallucination import check_grounding")
    print("  is_grounded, verdict = check_grounding(answer, sources, llm)")
    print()
    print("=" * 70)
