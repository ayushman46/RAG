import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronDown, CheckCircle2, AlertCircle, Copy, Check } from 'lucide-react'
import SourcePills from './SourcePills'

/**
 * MessageBubble.jsx - Individual Message Display Component
 * 
 * Displays either a user question or an AI answer
 * For AI answers, shows:
 *   1. Main answer text with "Show more" toggle if long
 *   2. Grounded status badge (✓ Verified or ⚠ Unverified)
 *   3. Collapsible sources section
 *   4. Collapsible hallucination verdict details
 * 
 * Uses Framer Motion for slide-in animations from left/right
 * depending on whether it's a user or AI message
 */

export default function MessageBubble({ message, copiedSourceId, onSourceCopy }) {
  /**
   * State to track if this message's answer is expanded or collapsed
   * (for the "Show more / Show less" toggle)
   */
  const [isExpanded, setIsExpanded] = useState(false)

  /**
   * State to track if the sources section is expanded
   * Starts collapsed so the message doesn't take up too much space
   */
  const [showSources, setShowSources] = useState(false)

  /**
   * State to track if the verification details section is expanded
   * Starts collapsed, shows advanced details about hallucination checking
   */
  const [showVerdict, setShowVerdict] = useState(false)

  /**
   * Determine if this is a user message or AI response
   */
  const isUser = message.role === 'user'

  /**
   * Check if the answer text is long enough to warrant a "Show more" button
   * If over 300 characters, we'll show it collapsed initially
   */
  const isLongText = message.content && message.content.length > 300

  /**
   * Get the text to display based on expansion state
   * If expanded or short text, show full text
   * If collapsed and long text, show first 300 characters + ellipsis
   */
  const displayText =
    !isLongText || isExpanded ? message.content : message.content.slice(0, 300) + '...'

  /**
   * Animation for message bubbles sliding in
   * User messages slide in from the right
   * AI messages slide in from the left
   */
  const bubbleVariants = {
    hidden: {
      opacity: 0,
      x: isUser ? 100 : -100,
      y: 10,
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
        duration: 0.4,
        ease: 'easeOut',
        // Slight spring bounce on arrival
        type: 'spring',
        damping: 12,
        stiffness: 100,
      },
    },
  }

  /**
   * Animation for expanding/collapsing sections (sources, verdict)
   */
  const expandVariants = {
    collapsed: { height: 0, opacity: 0 },
    expanded: { height: 'auto', opacity: 1 },
  }

  return (
    <motion.div
      // Align user messages to the right, AI messages to the left
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
      variants={bubbleVariants}
      initial="hidden"
      animate="visible"
    >
      {/* MESSAGE BUBBLE */}
      <div
        className={`
          max-w-lg rounded-2xl px-5 py-4 
          ${
            isUser
              ? // User message: purple gradient, rounded more on left and bottom
                'bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-br-sm'
              : // AI message: glass card with border, rounded more on right and bottom
                'bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 text-slate-100 rounded-bl-sm'
          }
        `}
      >
        {/* USER MESSAGE - Simple text, just the question */}
        {isUser && (
          <div>
            {/* Small person icon before the text */}
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {message.content}
            </p>
          </div>
        )}

        {/* AI ANSWER - Complex with multiple sections */}
        {!isUser && (
          <div className="space-y-3">
            {/* 1. ANSWER TEXT - Main response from the LLM */}
            <div>
              {/* The actual answer text */}
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {displayText}
              </p>

              {/* "Show more / Show less" button if text is long */}
              {isLongText && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="mt-2 text-xs text-purple-300 hover:text-purple-200 font-medium transition-colors"
                >
                  {isExpanded ? 'Show less' : 'Show more'}
                </button>
              )}
            </div>

            {/* 2. GROUNDED STATUS BADGE */}
            {typeof message.grounded === 'boolean' && (
              <div className="pt-2 border-t border-slate-700/30">
                {message.grounded ? (
                  // Verified badge: green with checkmark
                  <div className="flex items-center gap-2 group relative">
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-xs font-semibold text-emerald-300">
                        Verified
                      </span>
                    </div>
                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full left-0 mb-2 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-slate-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      Every claim is backed by your documents
                    </div>
                  </div>
                ) : (
                  // Unverified badge: amber with warning
                  <div className="flex items-center gap-2 group relative">
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/30">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-xs font-semibold text-amber-300">
                        Unverified
                      </span>
                    </div>
                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full left-0 mb-2 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-slate-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      This answer may contain unsupported claims
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 3. SOURCES SECTION - Collapsible */}
            {message.sources && message.sources.length > 0 && (
              <div className="pt-2 border-t border-slate-700/30 space-y-2">
                {/* Collapsible sources button */}
                <button
                  onClick={() => setShowSources(!showSources)}
                  className="flex items-center gap-2 text-xs font-medium text-slate-300 hover:text-slate-200 transition-colors"
                >
                  {/* Chevron rotates when expanded */}
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform ${
                      showSources ? 'rotate-180' : ''
                    }`}
                  />
                  Sources ({message.sources.length})
                </button>

                {/* Expanded sources content */}
                <motion.div
                  initial="collapsed"
                  animate={showSources ? 'expanded' : 'collapsed'}
                  variants={expandVariants}
                  overflow="hidden"
                >
                  {/* Source pills component */}
                  <SourcePills
                    sources={message.sources}
                    onCopy={onSourceCopy}
                    copiedId={copiedSourceId}
                  />
                </motion.div>
              </div>
            )}

            {/* 4. HALLUCINATION VERDICT - Advanced details (collapsed by default) */}
            {message.verdict && (
              <div className="pt-2 border-t border-slate-700/30">
                {/* Collapsible verdict button */}
                <button
                  onClick={() => setShowVerdict(!showVerdict)}
                  className="text-xs text-slate-400 hover:text-slate-300 transition-colors underline"
                >
                  {showVerdict ? 'Hide' : 'Show'} verification details
                </button>

                {/* Expanded verdict content */}
                <motion.div
                  initial="collapsed"
                  animate={showVerdict ? 'expanded' : 'collapsed'}
                  variants={expandVariants}
                  overflow="hidden"
                >
                  <p className="mt-2 text-xs text-slate-400 bg-slate-900/50 p-2 rounded border border-slate-700/30 font-mono">
                    "{message.verdict}"
                  </p>
                </motion.div>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}
