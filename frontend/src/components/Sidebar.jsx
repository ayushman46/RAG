import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'
import StatusCard from './StatusCard'

/**
 * Sidebar.jsx - Left Panel Component
 * 
 * Displays:
 *   1. Glowing RAG logo with animated pulsing dot
 *   2. Status card showing backend health and model info
 *   3. "How to use" instructions with numbered badges
 *   4. Clear conversation button
 *   5. Privacy notice at the bottom
 * 
 * Uses Framer Motion for animations like the pulsing status dot
 * and glassmorphism styling for premium appearance
 */

export default function Sidebar({ apiStatus, onClearMessages, messageCount, onClose }) {
  /**
   * Animation for the pulsing status indicator dot
   * The dot fades in and out continuously
   */
  const pulseVariants = {
    // Start fully opaque
    animate: {
      opacity: [1, 0.4, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  }

  /**
   * Animation for text fade-in on page load
   */
  const textVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  }

  return (
    <div className="flex flex-col h-full w-full overflow-y-auto bg-slate-950/50 backdrop-blur-sm">
      {/* TOP SECTION - Logo and branding */}
      <motion.div
        className="p-6 border-b border-slate-800/50"
        variants={textVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Logo with gradient text and animated pulsing dot */}
        <div className="flex items-center gap-3 mb-2">
          {/* Glowing logo text */}
          <div className="flex items-baseline gap-2">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-purple-500 to-cyan-400 bg-clip-text text-transparent">
              RAG
            </h1>
            {/* Animated pulsing status dot */}
            <motion.div
              className="w-2 h-2 rounded-full bg-emerald-400"
              variants={pulseVariants}
              animate="animate"
            />
          </div>
        </div>

        {/* Subtitle */}
        <p className="text-xs text-slate-400 font-medium tracking-wide">
          DOCUMENT INTELLIGENCE
        </p>
      </motion.div>

      {/* MIDDLE SECTION - Status and instructions */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {/* Status card showing backend health and model info */}
        <StatusCard apiStatus={apiStatus} />

        {/* How to use instructions */}
        <motion.div
          className="space-y-4"
          variants={textVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            How to use
          </h3>

          {/* Step 1 */}
          <div className="flex gap-3 items-start">
            {/* Purple badge with number */}
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">1</span>
            </div>
            {/* Step description */}
            <div className="flex-1 pt-1">
              <p className="text-sm text-slate-300">Type your question below</p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-3 items-start">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">2</span>
            </div>
            <div className="flex-1 pt-1">
              <p className="text-sm text-slate-300">Hit Enter or click Ask</p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-3 items-start">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">3</span>
            </div>
            <div className="flex-1 pt-1">
              <p className="text-sm text-slate-300">See answers with sources</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* BOTTOM SECTION - Clear button and privacy notice */}
      <motion.div
        className="border-t border-slate-800/50 p-6 space-y-3"
        variants={textVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.4 }}
      >
        {/* Clear conversation button */}
        <button
          onClick={onClearMessages}
          disabled={messageCount === 0}
          className={`w-full py-2.5 rounded-lg font-medium text-sm transition-all duration-200 ${
            messageCount === 0
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
              : 'bg-slate-800 text-slate-200 hover:bg-slate-700 active:scale-95'
          }`}
        >
          Clear conversation
        </button>

        {/* Privacy notice */}
        <p className="text-xs text-slate-500 text-center leading-relaxed">
          All processing is local. No data leaves your machine.
        </p>
      </motion.div>
    </div>
  )
}
