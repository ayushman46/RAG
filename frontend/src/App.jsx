import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Sidebar from './components/Sidebar'
import ChatArea from './components/ChatArea'
import { FileUploader } from './components/FileUploader'
import { useRagApi } from './hooks/useRagApi'
import { useFileUpload } from './hooks/useFileUpload'
import './index.css'

/**
 * App.jsx - Root Component
 * 
 * This is the main component that:
 *   1. Sets up the overall page layout (sidebar + chat area)
 *   2. Manages file uploads and ingestion
 *   3. Imports Google Fonts for typography
 *   4. Sets the dark theme background with noise texture
 *   5. Manages the list of messages in state
 *   6. Passes data and callbacks to child components
 * 
 * Layout:
 *   Desktop: Sidebar on left (30%) + Chat on right (70%)
 *   Mobile: Sidebar hidden, Chat takes full width (drawer menu optional)
 */

export default function App() {
  // Import the custom hook that handles all API communication
  const { checkHealth, askQuestion, apiStatus, isLoading } = useRagApi()
  
  // Import the file upload hook
  const {
    uploadFile,
    ingestDocuments,
    isUploading,
    uploadProgress,
    uploadedFiles,
    error: uploadError,
    ingestionStatus,
    clearError,
    clearFiles,
  } = useFileUpload()

  // State to store all messages in the conversation
  // Each message is an object: { id, role, content, grounded, verdict, sources }
  // role is either 'user' or 'assistant'
  const [messages, setMessages] = useState([])

  // State to control whether the sidebar is visible on mobile
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  // State to control whether to show the file uploader
  const [showUploader, setShowUploader] = useState(true)
  
  // State to track if documents have been ingested
  const [documentsReady, setDocumentsReady] = useState(false)

  /**
   * Effect: Run on component mount (when page first loads)
   * 
   * We check the backend health when the page loads,
   * and then set up an interval to check every 30 seconds
   * This keeps us updated on whether the backend is online
   */
  useEffect(() => {
    // Check health immediately when page loads
    checkHealth()

    // Set up an interval to check every 30 seconds
    // This way if the backend goes offline or comes back online,
    // we notice it and update the UI
    const healthCheckInterval = setInterval(checkHealth, 30000)

    // Cleanup: when the component unmounts, clear the interval
    return () => clearInterval(healthCheckInterval)
  }, [checkHealth])

  /**
   * Function: handleSubmitQuestion
   * 
   * Called when the user submits a question from the input bar
   * 
   * Flow:
   *   1. Add the user's question as a message bubble immediately
   *   2. Show the loading spinner
   *   3. Call askQuestion to get the AI's response
   *   4. Add the AI's response as a message bubble
   * 
   * This gives instant feedback to the user (their question appears immediately)
   * while we wait for the LLM to generate an answer
   */
  const handleSubmitQuestion = async (questionText) => {
    // Do nothing if the question is empty
    if (!questionText.trim()) return

    // Do nothing if we're already waiting for a response
    if (isLoading) return

    // Create a message object for the user's question
    // We add it to the conversation immediately so the user sees it right away
    const userMessage = {
      id: `user-${Date.now()}`, // Unique ID based on timestamp
      role: 'user',
      content: questionText,
    }

    // Add the user message to the list
    // This will cause the message bubble to appear immediately
    setMessages((prev) => [...prev, userMessage])

    try {
      // Call the API to get an answer
      // This will show the loading dots animation while it's processing
      const response = await askQuestion(questionText)

      // Create a message object for the AI's answer
      const aiMessage = {
        id: `assistant-${Date.now()}`, // Unique ID
        role: 'assistant',
        content: response.answer,
        grounded: response.grounded,
        verdict: response.verdict,
        sources: response.sources,
      }

      // Add the AI message to the list
      // This will show the answer bubble with all the details
      setMessages((prev) => [...prev, aiMessage])
    } catch (err) {
      // If something went wrong, add an error message
      // The error details are already in the setError state in useRagApi
      // So the Sidebar will show the error to the user
    }
  }

  /**
   * Function: handleClearMessages
   * 
   * Called when the user clicks "Clear conversation" button
   * Resets the messages array to empty
   */
  const handleClearMessages = () => {
    setMessages([])
    setSidebarOpen(false)
  }
  
  /**
   * Function: handleFileUpload
   * Called when user selects or drops a file
   */
  const handleFileUpload = async (file) => {
    await uploadFile(file)
  }
  
  /**
   * Function: handleIngestDocuments
   * Called when user clicks "Ingest & Process Files" button
   */
  const handleIngestDocuments = async () => {
    const result = await ingestDocuments()
    if (result) {
      setDocumentsReady(true)
      // Hide uploader after successful ingestion
      setTimeout(() => setShowUploader(false), 1000)
    }
  }
  
  /**
   * Function: handleShowUploader
   * Show the uploader again to upload more files
   */
  const handleShowUploader = () => {
    setShowUploader(true)
    clearFiles()
  }

  /**
   * Animation variants for Framer Motion
   * These define how elements animate when they enter the page
   */
  const containerVariants = {
    // When the page first loads, start hidden
    hidden: { opacity: 0 },
    // Animate to visible
    visible: {
      opacity: 1,
      transition: {
        // Stagger the children so sidebar slides in, then chat fades in
        staggerChildren: 0.1,
      },
    },
  }

  const sidebarVariants = {
    // Sidebar slides in from the left
    hidden: { x: -400, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  }

  const chatVariants = {
    // Chat area fades in
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.5, delay: 0.1 },
    },
  }

  return (
    <>
      {/* Import Google Fonts for Inter typography */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />

      {/* Main container with dark theme background */}
      <motion.div
        className="flex h-screen w-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Add a subtle noise texture overlay to the background */}
        <div className="absolute inset-0 pointer-events-none opacity-5">
          <svg width="100%" height="100%">
            <filter id="noise">
              <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" />
            </filter>
            <rect width="100%" height="100%" filter="url(#noise)" />
          </svg>
        </div>

        {/* SIDEBAR - Left panel (30% on desktop, hidden on mobile) */}
        <motion.div
          className="hidden md:flex w-1/3 flex-shrink-0 border-r border-slate-800 bg-slate-950/50 backdrop-blur-sm"
          variants={sidebarVariants}
        >
          <Sidebar
            apiStatus={apiStatus}
            onClearMessages={handleClearMessages}
            messageCount={messages.length}
            // On mobile, closing sidebar is handled by state
            onClose={() => setSidebarOpen(false)}
          />
        </motion.div>

        {/* On mobile: Sidebar as an overlay/drawer when sidebarOpen is true */}
        {sidebarOpen && (
          <motion.div
            className="fixed inset-0 z-50 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Semi-transparent backdrop */}
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setSidebarOpen(false)}
            />
            {/* Sidebar drawer */}
            <motion.div
              className="relative z-50 h-full w-72 bg-slate-950 border-r border-slate-800"
              initial={{ x: -400 }}
              animate={{ x: 0 }}
              exit={{ x: -400 }}
            >
              <Sidebar
                apiStatus={apiStatus}
                onClearMessages={handleClearMessages}
                messageCount={messages.length}
                onClose={() => setSidebarOpen(false)}
              />
            </motion.div>
          </motion.div>
        )}

        {/* CHAT AREA - Right panel (70% on desktop, 100% on mobile) */}
        <motion.div
          className="flex-1 flex flex-col overflow-hidden"
          variants={chatVariants}
        >
          {/* Show file uploader if documents aren't ready */}
          {showUploader && !documentsReady ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gradient-to-br from-slate-900/50 to-slate-900 overflow-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-2xl"
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="mb-8 text-center"
                >
                  <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                    📚 RAG Chat
                  </h1>
                  <p className="text-zinc-400 text-lg">Upload your documents and ask intelligent questions</p>
                </motion.div>

                <FileUploader
                  onUpload={handleFileUpload}
                  isUploading={isUploading}
                  uploadProgress={uploadProgress}
                  uploadedFiles={uploadedFiles}
                  error={uploadError}
                  ingestionStatus={ingestionStatus}
                  onIngest={handleIngestDocuments}
                  onClear={clearFiles}
                />

                {/* Info cards */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4"
                >
                  {[
                    { icon: '📄', title: 'Upload', desc: 'Drag & drop your PDFs' },
                    { icon: '⚙️', title: 'Process', desc: 'Automatic ingestion' },
                    { icon: '💬', title: 'Ask', desc: 'Get AI-powered answers' },
                  ].map((item, idx) => (
                    <motion.div
                      key={idx}
                      whileHover={{ scale: 1.05 }}
                      className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-cyan-500/10 border border-purple-500/20 text-center"
                    >
                      <p className="text-3xl mb-2">{item.icon}</p>
                      <p className="text-white font-semibold">{item.title}</p>
                      <p className="text-zinc-400 text-sm">{item.desc}</p>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
            </div>
          ) : (
            <>
              {/* Chat area: scrollable messages + input */}
              <ChatArea
                messages={messages}
                isLoading={isLoading}
                onSubmitQuestion={handleSubmitQuestion}
                onClearMessages={handleClearMessages}
                onUploadMore={handleShowUploader}
              />
            </>
          )}
        </motion.div>
      </motion.div>
    </>
  )
}
