import { motion } from 'framer-motion'
import { FileText, Check, Copy } from 'lucide-react'

/**
 * SourcePills.jsx - Source Document Display Component
 * 
 * Shows expandable source document citations as clickable pills
 * Features:
 *   1. File icon with monospace filename
 *   2. Page number if available
 *   3. Click to copy filename to clipboard
 *   4. "Copied!" feedback for 2 seconds
 * 
 * Takes array of sources from the API response:
 * Each source: { content: string, metadata: { source: filename, page?: number } }
 */

export default function SourcePills({ sources, onCopy, copiedId }) {
  /**
   * Animation for pills staggering in
   */
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  }

  /**
   * Animation for individual pill
   */
  const pillVariants = {
    hidden: { opacity: 0, y: -5 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 },
    },
  }

  return (
    <motion.div
      className="flex flex-wrap gap-2 pt-2"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Each source becomes a clickable pill */}
      {sources.map((source, index) => (
        <motion.button
          key={index}
          variants={pillVariants}
          // When clicked, copy the filename to clipboard
          onClick={() => {
            // Get the filename from metadata
            const filename = source.metadata?.source || `Source ${index + 1}`
            // Copy to clipboard
            navigator.clipboard.writeText(filename)
            // Show feedback
            onCopy(index)
          }}
          // Hover and tap animations
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          className="relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-700/40 border border-slate-600/40 hover:border-slate-500/60 text-slate-300 hover:text-slate-200 transition-all duration-200 group"
          title={`Click to copy: ${source.metadata?.source || `Source ${index + 1}`}`}
        >
          {/* File icon */}
          <FileText className="w-3 h-3 text-cyan-400 flex-shrink-0" />

          {/* Filename in monospace font */}
          <span className="text-xs font-mono truncate">
            {source.metadata?.source || `Source ${index + 1}`}
          </span>

          {/* Page number if available */}
          {source.metadata?.page && (
            <span className="text-xs text-slate-500 font-mono">
              p{source.metadata.page}
            </span>
          )}

          {/* Copy icon - shown on hover */}
          {copiedId !== index && (
            <Copy className="w-3 h-3 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
          )}

          {/* Check icon - shown when copied */}
          {copiedId === index && (
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', damping: 10 }}
            >
              <Check className="w-3 h-3 text-emerald-400 flex-shrink-0" />
            </motion.div>
          )}

          {/* Tooltip: "Copied!" feedback */}
          {copiedId === index && (
            <motion.div
              className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-emerald-500 text-white text-xs font-medium whitespace-nowrap"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              Copied!
            </motion.div>
          )}
        </motion.button>
      ))}
    </motion.div>
  )
}
