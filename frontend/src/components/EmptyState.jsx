import { motion } from 'framer-motion'
import { Brain } from 'lucide-react'

/**
 * EmptyState.jsx - Display When No Messages Yet
 * 
 * Shown when the chat first loads with no messages
 * Features:
 *   1. Floating brain icon animation
 *   2. "Ask anything about your documents" heading
 *   3. Three clickable example questions that the user can click to auto-fill
 * 
 * When user clicks one of the example pills, it should set the input value
 * and the parent component (ChatArea) should submit it automatically
 */

export default function EmptyState({ onExampleClick }) {
  /**
   * Animation for the floating brain icon
   * Moves up and down continuously with ease-in-out
   */
  const floatingVariants = {
    // Start at center position
    initial: { y: 0 },
    // Float up and down
    animate: {
      y: [-10, 10, -10],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  }

  /**
   * Animation for the main container fade-in
   */
  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  }

  /**
   * Animation for the example pill buttons
   * They stagger in one after another
   */
  const pillVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.4,
      },
    }),
  }

  /**
   * Array of example questions the user can click
   */
  const examples = [
    'What are the main topics covered?',
    'Summarize the key points',
    'What does the document say about [topic]?',
  ]

  return (
    <motion.div
      className="flex-1 flex flex-col items-center justify-center px-6 py-12"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Floating brain icon */}
      <motion.div
        className="mb-8"
        variants={floatingVariants}
        initial="initial"
        animate="animate"
      >
        {/* Brain icon with gradient color */}
        <Brain className="w-24 h-24 text-purple-400/50" strokeWidth={1.5} />
      </motion.div>

      {/* Main heading */}
      <h2 className="text-3xl font-bold text-white text-center mb-2">
        Ask anything about your documents
      </h2>

      {/* Subtitle text */}
      <p className="text-lg text-slate-400 text-center mb-8 max-w-sm">
        Use semantic search to find answers across your knowledge base
      </p>

      {/* Example question pills */}
      <div className="flex flex-col gap-3 w-full max-w-md">
        {/* Heading for examples */}
        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">
          Try asking...
        </p>

        {/* Example pills */}
        {examples.map((example, i) => (
          <motion.button
            key={i}
            // Pass the example text when clicked
            onClick={() => onExampleClick(example)}
            // Animation: stagger each pill
            custom={i}
            variants={pillVariants}
            initial="hidden"
            animate="visible"
            // Hover effect: scale up slightly
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            // Styling: gradient border, glass effect, text highlight
            className="p-4 rounded-lg border border-slate-700/50 bg-slate-800/30 hover:bg-slate-800/50 text-slate-300 hover:text-slate-200 transition-all duration-200 text-sm text-left group"
          >
            {/* Small right arrow on hover */}
            <div className="flex items-center justify-between">
              <span>{example}</span>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                →
              </span>
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  )
}
