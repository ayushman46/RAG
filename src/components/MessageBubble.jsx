import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Check, AlertTriangle } from 'lucide-react'
import SourcePills from './SourcePills'

export default function MessageBubble({ message, onCopySource }) {
  const [showMore, setShowMore] = useState(false)
  const [showSources, setShowSources] = useState(false)
  const [showVerdict, setShowVerdict] = useState(false)

  if (message.type === 'user') {
    return (
      <div className="flex justify-end mb-8 w-full">
        <div className="max-w-[85%] lg:max-w-[75%] bg-[#1e1e1e] text-white/90 rounded-2xl px-6 py-4 border border-white/[0.05] shadow-lg">
          <p className="text-[15px] leading-relaxed font-normal">{message.content}</p>
        </div>
      </div>
    )
  }

  if (message.isError) {
    return (
      <div className="flex justify-start mb-8 w-full">
        <div className="max-w-full bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl px-6 py-4">
          <p className="text-[15px] leading-relaxed">{message.content}</p>
        </div>
      </div>
    )
  }

  const maxLength = 400
  const isLong = message.content.length > maxLength
  const displayText = showMore ? message.content : message.content.slice(0, maxLength)

  return (
    <div className="flex justify-start mb-10 w-full">
      <div className="w-full space-y-4">
        {/* Main Message */}
        <div className="text-[15px] leading-8 text-white/80 font-normal">
          <p className="whitespace-pre-wrap">
            {displayText}
            {isLong && !showMore && <span className="text-white/40">...</span>}
          </p>

          {isLong && (
            <button
              onClick={() => setShowMore(!showMore)}
              className="mt-3 text-[13px] text-white/40 hover:text-white transition-colors flex items-center gap-1 group"
            >
              {showMore ? 'Show less' : 'Read full response'}
              <ChevronDown
                size={14}
                className={`transition-transform duration-300 ${showMore ? 'rotate-180' : 'group-hover:translate-y-0.5'}`}
              />
            </button>
          )}
        </div>

        {/* Metadata Badges */}
        <div className="flex flex-wrap items-center gap-2 pt-2">
          {message.grounded !== undefined && (
            <button
              onClick={() => setShowVerdict(!showVerdict)}
              className={`flex items-center gap-2 text-[11px] uppercase tracking-wider font-semibold px-3 py-1.5 rounded-full border transition-all ${
                message.grounded 
                  ? 'border-emerald-500/20 text-emerald-500/80 bg-emerald-500/5 hover:bg-emerald-500/10' 
                  : 'border-amber-500/20 text-amber-500/80 bg-amber-500/5 hover:bg-amber-500/10'
              }`}
            >
              {message.grounded ? (
                <>
                  <Check size={12} />
                  <span>Grounded</span>
                </>
              ) : (
                <>
                  <AlertTriangle size={12} />
                  <span>Unverified</span>
                </>
              )}
            </button>
          )}

          {message.sources && message.sources.length > 0 && (
            <button
              onClick={() => setShowSources(!showSources)}
              className="flex items-center gap-2 text-[11px] uppercase tracking-wider font-semibold px-3 py-1.5 rounded-full bg-white/5 border border-white/5 hover:border-white/20 text-white/60 hover:text-white/90 transition-all"
            >
              <span>{message.sources.length} Reference{message.sources.length !== 1 ? 's' : ''}</span>
              <ChevronDown size={12} className={`transition-transform duration-300 ${showSources ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>

        {/* Expanded Details */}
        <AnimatePresence>
          {showVerdict && message.verdict && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white/[0.02] border border-white/5 rounded-xl px-4 py-3 text-[13px] text-white/60 overflow-hidden"
            >
              <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-2">Verification Detail</p>
              <p className="leading-relaxed">{message.verdict}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showSources && message.sources && message.sources.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-2">
                <SourcePills sources={message.sources} onCopy={onCopySource} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
