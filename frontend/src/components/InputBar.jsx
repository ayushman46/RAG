import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Send } from 'lucide-react'

/**
 * InputBar.jsx - Question Input Component
 * 
 * Sticky bottom input bar where users type their questions.
 * 
 * Features:
 *   1. Text input with placeholder
 *   2. Send button with purple glow when active
 *   3. Enter to submit, Shift+Enter for newline
 *   4. Glass card styling with purple border glow on focus
 *   5. Button disabled and greyed when input is empty
 *   6. Hint text below input
 * 
 * Props:
 *   - onSubmit: callback function(question) when user sends
 *   - isLoading: boolean, disables input while API is processing
 */

export default function InputBar({ onSubmit, isLoading }) {
  /**
   * State for the input value
   */
  const [input, setInput] = useState('')

  /**
   * Check if input has content (used to enable/disable send button)
   */
  const hasInput = input.trim().length > 0

  /**
   * Handle sending the question
   * Calls parent's onSubmit callback, then clears input
   */
  const handleSubmit = useCallback(() => {
    if (hasInput && !isLoading) {
      onSubmit(input)
      setInput('')
    }
  }, [input, hasInput, isLoading, onSubmit])

  /**
   * Handle key press in input field
   * Enter alone = submit
   * Shift+Enter = newline
   */
  const handleKeyDown = useCallback(
    (e) => {
      // If Enter is pressed without Shift, submit the question
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSubmit()
      }
      // If Shift+Enter, browser default newline behavior happens
    },
    [handleSubmit]
  )

  return (
    <motion.div
      className="sticky bottom-0 w-full bg-gradient-to-t from-slate-950 via-slate-950 to-slate-950/50 pt-4 pb-6 px-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', damping: 12, stiffness: 100, delay: 0.3 }}
    >
      {/* Main input container with glass card style */}
      <div className="max-w-4xl mx-auto">
        <motion.div
          className={`flex items-end gap-3 p-3 rounded-lg border transition-all duration-200 ${
            input
              ? 'bg-slate-800/50 border-purple-600/50 backdrop-blur-sm shadow-lg shadow-purple-600/20'
              : 'bg-slate-800/30 border-slate-700/30 backdrop-blur-sm'
          }`}
          whileFocus={{ scale: 1.02 }}
        >
          {/* Text input field */}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder="Ask anything about your documents..."
            className="flex-1 bg-transparent text-slate-100 placeholder-slate-500 focus:outline-none text-sm resize-none"
            style={{ maxHeight: '120px' }}
          />

          {/* Send button - animates glow when input has content */}
          <motion.button
            onClick={handleSubmit}
            disabled={!hasInput || isLoading}
            whileHover={hasInput && !isLoading ? { scale: 1.1 } : {}}
            whileTap={hasInput && !isLoading ? { scale: 0.95 } : {}}
            className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
              hasInput && !isLoading
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/50 cursor-pointer'
                : 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
            }`}
            title={hasInput ? 'Send message (Enter)' : 'Type a message to send'}
          >
            <Send className="w-4 h-4" />
          </motion.button>
        </motion.div>

        {/* Hint text below input */}
        <p className="text-xs text-slate-500 mt-2 text-center">
          Press Enter to send • Shift+Enter for new line
        </p>
      </div>
    </motion.div>
  )
}
