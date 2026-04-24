import { useState } from 'react'
import { motion } from 'framer-motion'
import { Copy, Check } from 'lucide-react'

export default function SourcePills({ sources, onCopy }) {
  const [copiedId, setCopiedId] = useState(null)

  const handleCopy = (source) => {
    const text = source.metadata?.source || source
    navigator.clipboard.writeText(text)
    setCopiedId(text)
    onCopy?.()
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="flex flex-wrap gap-2">
      {sources.map((source, index) => {
        const sourceText = typeof source === 'string' ? source : source.metadata?.source || 'Unknown'
        const pageNum = source.metadata?.page ? ` (p.${source.metadata.page})` : ''
        const isCopied = copiedId === sourceText

        return (
          <motion.button
            key={index}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => handleCopy(source)}
            className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-full text-[11px] text-white/60 font-mono transition-all hover:text-white/90 relative group"
          >
            <span className="truncate max-w-[180px]">
              {sourceText}{pageNum}
            </span>
            <motion.div
              animate={{ opacity: isCopied ? 1 : 0.6 }}
              transition={{ duration: 0.2 }}
            >
              {isCopied ? (
                <Check size={12} className="text-emerald-400" />
              ) : (
                <Copy size={12} className="group-hover:opacity-100 opacity-60" />
              )}
            </motion.div>

            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black border border-white/10 rounded shadow-xl text-[10px] text-white/80 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              {isCopied ? 'Copied' : 'Copy reference'}
            </div>
          </motion.button>
        )
      })}
    </div>
  )
}
