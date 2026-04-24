import { useState, useEffect } from 'react'
import axios from 'axios'

const API_BASE_URL = 'http://localhost:8000'

export const useRagApi = () => {
  const [apiStatus, setApiStatus] = useState('checking')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  // Check backend health
  const checkHealth = async () => {
    try {
      setApiStatus('checking')
      const response = await axios.get(`${API_BASE_URL}/health`, {
        timeout: 5000,
      })
      if (response.data.status === 'ok') {
        setApiStatus('connected')
        return true
      }
    } catch (err) {
      setApiStatus('offline')
      return false
    }
  }

  // Ask a question to the RAG pipeline
  const askQuestion = async (question) => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await axios.post(
        `${API_BASE_URL}/ask`,
        { question },
        { timeout: 60000 }
      )

      const { answer, grounded, verdict, sources } = response.data

      return {
        answer,
        grounded,
        verdict,
        sources: sources || [],
      }
    } catch (err) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to get response'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  // Initial health check on mount
  useEffect(() => {
    checkHealth()
    const interval = setInterval(checkHealth, 30000)
    return () => clearInterval(interval)
  }, [])

  return {
    apiStatus,
    isLoading,
    error,
    checkHealth,
    askQuestion,
  }
}
