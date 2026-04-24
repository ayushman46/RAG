import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload } from 'lucide-react'
import MessageBubble from './MessageBubble'
import LoadingBubble from './LoadingBubble'
import InputBar from './InputBar'
import EmptyState from './EmptyState'

/**
 * ChatArea.jsx - Main Chat Container Component
 * 
 * Orchestrates the entire chat experience:
 *   - Scrollable messages area with auto-scroll to bottom
 *   - Renders all messages (user and AI)
 *   - Shows LoadingBubble while API is processing
 *   - Shows EmptyState when no messages yet
 *   - InputBar at bottom for sending questions
 * 
 * This component ties together all the other components into
 * a cohesive chat interface.
 * 
 * Props:
 *   - messages: array of {role, content, grounded?, verdict?, sources?}
 *   - onSubmitQuestion: callback(question) to parent
 *   - isLoading: boolean, is API processing?
 *   - onClearMessages: callback to parent to reset
 *   - onUploadMore: callback to show uploader again
 */

export default function ChatArea({
  messages,
  onSubmitQuestion,
  isLoading,
  onClearMessages,
  onUploadMore,
}) {
  /**
   * Track which source was recently copied (for tooltip feedback)
   */
  const [copiedSourceId, setCopiedSourceId] = useState(null)

  /**
   * Reference to scroll container
   * Used to auto-scroll to bottom when new messages arrive
   */
  const scrollRef = useRef(null)

  /**
   * Auto-scroll to bottom whenever messages change or loading state changes
   */
  useEffect(() => {
    if (scrollRef.current) {
      // Use setTimeout to ensure scroll happens after render
      setTimeout(() => {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight
      }, 0)
    }
  }, [messages, isLoading])

  /**
   * Handle source copy feedback
   * Shows "Copied!" tooltip on source pill for 2 seconds
   */
  const handleSourceCopy = useCallback((sourceIndex) => {
    setCopiedSourceId(sourceIndex)
    setTimeout(() => setCopiedSourceId(null), 2000)
  }, [])

  /**
   * Handle example question click from EmptyState
   * Auto-fills input and submits
   */
  const handleExampleClick = useCallback(
    (question) => {
      onSubmitQuestion(question)
    },
    [onSubmitQuestion]
  )

  return (
    <div className="flex flex-col h-screen md:h-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Top bar with title and message count */}
      <div className="flex-shrink-0 border-b border-slate-700/30 bg-slate-900/50 backdrop-blur-sm px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          {/* Page title */}
          <h1 className="text-lg font-semibold text-slate-100">
            Ask your documents
          </h1>

          {/* Right side controls */}
          <div className="flex items-center space-x-4">
            {/* Message count badge */}
            {messages.length > 0 && (
              <motion.div
                className="px-3 py-1 rounded-full bg-purple-600/30 border border-purple-500/50 text-sm text-purple-200"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 12 }}
              >
                {messages.length} message{messages.length !== 1 ? 's' : ''}
              </motion.div>
            )}

            {/* Upload more button */}
            {onUploadMore && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onUploadMore}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-medium text-sm hover:shadow-lg hover:shadow-purple-500/50 transition-all"
              >
                <Upload size={16} />
                <span>Upload More</span>
              </motion.button>
            )}
          </div>
        </div>
      </div>

      {/* Scrollable messages container */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 md:px-6 py-6 space-y-4 max-w-4xl mx-auto w-full"
      >
        {/* Show empty state if no messages and not loading */}
        {messages.length === 0 && !isLoading && (
          <EmptyState onExampleClick={handleExampleClick} />
        )}

        {/* Render all messages with animation */}
        <AnimatePresence mode="popLayout">
          {messages.map((message, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ type: 'spring', damping: 12, stiffness: 100 }}
            >
              <MessageBubble
                message={message}
                copiedSourceId={copiedSourceId}
                onSourceCopy={handleSourceCopy}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Show loading bubble while API is processing */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ type: 'spring', damping: 12, stiffness: 100 }}
          >
            <LoadingBubble />
          </motion.div>
        )}
      </div>

      {/* Input bar at bottom */}
      <InputBar onSubmit={onSubmitQuestion} isLoading={isLoading} />
    </div>
  )
}
