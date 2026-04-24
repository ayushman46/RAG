import { useState, useCallback } from 'react'
import axios from 'axios'

/**
 * Custom React Hook: useRagApi
 * 
 * Handles all API communication with the FastAPI backend at localhost:8000
 * Provides functions to:
 *   - Check backend health (/health endpoint)
 *   - Ask questions (/ask endpoint)
 * 
 * Returns state and functions that components can use to interact with the API
 */

export function useRagApi() {
  // The base URL of our FastAPI backend
  // In production, this would be an environment variable
  const API_BASE_URL = 'http://localhost:8000'

  // State for whether the backend API is currently online
  // 'checking' = we're currently checking the health endpoint
  // 'connected' = backend is online and responsive
  // 'offline' = backend is not reachable or returned an error
  const [apiStatus, setApiStatus] = useState('checking')

  // State for whether we're currently waiting for an API response
  // Used to show the loading spinner/dots animation while fetching
  const [isLoading, setIsLoading] = useState(false)

  // State for any error messages that occurred during API calls
  // Set to null when there's no error, or a string describing the error
  const [error, setError] = useState(null)

  /**
   * Function: checkHealth
   * 
   * Calls GET /health endpoint to see if the backend is running
   * Sets apiStatus to 'connected' if successful, 'offline' if it fails
   * This is called on page load and then every 30 seconds automatically
   */
  const checkHealth = useCallback(async () => {
    // Start in 'checking' state
    setApiStatus('checking')

    try {
      // Send GET request to the /health endpoint
      // timeout of 5 seconds means if it takes longer than 5 seconds, we give up
      const response = await axios.get(`${API_BASE_URL}/health`, {
        timeout: 5000,
      })

      // If the response has status.ok in the data, the backend is online
      if (response.data.status === 'ok') {
        // Backend is healthy!
        setApiStatus('connected')
        setError(null)
      }
    } catch (err) {
      // If any error happens (network error, timeout, etc), backend is offline
      setApiStatus('offline')
      setError('Backend is not responding. Make sure uvicorn api:app --reload is running.')
    }
  }, [])

  /**
   * Function: askQuestion
   * 
   * Sends a question to the /ask endpoint
   * Takes the user's question string as a parameter
   * Returns an object with: answer, grounded, verdict, sources
   * Or throws an error if the API call fails
   * 
   * This is called by the input component when the user submits a question
   */
  const askQuestion = useCallback(async (question) => {
    // Check that the question is not empty
    if (!question || !question.trim()) {
      throw new Error('Question cannot be empty')
    }

    // Check that the backend is connected before trying to ask
    if (apiStatus !== 'connected') {
      throw new Error('Backend is offline. Please try again in a moment.')
    }

    // Start loading — show the animated dots
    setIsLoading(true)
    setError(null)

    try {
      // Send POST request to /ask with the question in the request body
      // timeout of 120 seconds because LLM inference can be slow
      const response = await axios.post(
        `${API_BASE_URL}/ask`,
        {
          question: question,
        },
        {
          timeout: 120000, // 2 minutes for the LLM to generate an answer
        }
      )

      // The response contains: answer, grounded, verdict, sources
      // Return it so the component can display the data
      const data = {
        answer: response.data.answer,
        grounded: response.data.grounded,
        verdict: response.data.verdict,
        sources: response.data.sources || [],
      }

      // Stop loading
      setIsLoading(false)

      // Return the data to the caller
      return data
    } catch (err) {
      // Stop loading
      setIsLoading(false)

      // Determine what error message to show based on what went wrong
      let errorMessage = 'Failed to get response from the backend'

      // If the API server responded with an error status code (like 500)
      if (err.response) {
        errorMessage = err.response.data?.detail || 'Server error'
      }
      // If the request timed out (took too long)
      else if (err.code === 'ECONNABORTED') {
        errorMessage =
          'Request timed out. The LLM is taking too long. Try a simpler question.'
      }
      // If there was a network connectivity error
      else if (err.message === 'Network Error') {
        errorMessage =
          'Network error. Is the backend running at ' + API_BASE_URL + '?'
      }

      // Set the error state so the component can show it to the user
      setError(errorMessage)

      // Throw the error so the caller knows something went wrong
      throw new Error(errorMessage)
    }
  }, [apiStatus])

  /**
   * Return an object with:
   *   - The current states (apiStatus, isLoading, error)
   *   - The functions to call (checkHealth, askQuestion)
   * 
   * Components will use these by calling: const { apiStatus, askQuestion } = useRagApi()
   */
  return {
    // Current states
    apiStatus,
    isLoading,
    error,
    setError,

    // Functions to call
    checkHealth,
    askQuestion,
  }
}
