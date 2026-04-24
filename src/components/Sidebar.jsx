import { motion } from 'framer-motion'
import { Trash2, Network } from 'lucide-react'
import StatusCard from './StatusCard'

export default function Sidebar({ apiStatus, onClearChat, messageCount }) {
  const pulseVariants = {
    animate: {
      scale: [1, 1.2, 1],
      opacity: [0.5, 1, 0.5],
      transition: { duration: 3, repeat: Infinity, ease: "easeInOut" },
    },
  }

  return (
    <div className="flex flex-col h-full text-sm">
      {/* Header */}
      <div className="p-6 border-b border-white/5 flex flex-col justify-center h-[80px]">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3"
        >
          <div className="relative flex items-center justify-center w-6 h-6">
            <motion.div
              variants={pulseVariants}
              animate="animate"
              className="absolute w-2 h-2 bg-white rounded-full shadow-[0_0_12px_rgba(255,255,255,0.9)]"
            />
            <Network className="text-white/40 w-4 h-4 absolute z-10" />
          </div>
          <h1 className="text-[15px] font-medium tracking-wide text-white/90">Neural Canvas</h1>
        </motion.div>
      </div>

      {/* Status */}
      <div className="p-6 border-b border-white/5">
        <p className="text-[9px] tracking-[0.2em] text-white/30 uppercase font-bold mb-4">System Status</p>
        <StatusCard
          status={apiStatus}
          llmModel="llama3.2"
          embeddingsModel="nomic-embed"
          vectorDb="ChromaDB"
        />
      </div>

      {/* Instructions */}
      <div className="flex-1 p-6 space-y-8 overflow-y-auto">
        <div>
          <p className="text-[9px] tracking-[0.2em] text-white/30 uppercase font-bold mb-4">Workflow</p>
          <div className="space-y-4 text-[13px] text-white/50">
            {[
              { num: '01', text: 'Ingest source materials' },
              { num: '02', text: 'Query knowledge base' },
              { num: '03', text: 'Verify semantic grounding' },
            ].map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * i }}
                className="flex items-start gap-4 group"
              >
                <div className="font-mono text-[10px] mt-0.5 text-white/20 group-hover:text-cyan/80 transition-colors">
                  {step.num}
                </div>
                <p className="leading-relaxed group-hover:text-white/90 transition-colors">{step.text}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Stats */}
        {messageCount > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-4 rounded-xl bg-white/[0.02] border border-white/5"
          >
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-white/40">Interactions</span>
              <span className="font-mono text-white/80">{messageCount}</span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-white/5">
        <motion.button
          whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.05)" }}
          whileTap={{ scale: 0.98 }}
          onClick={onClearChat}
          className="w-full px-4 py-2.5 rounded-lg text-white/50 hover:text-white/90 font-medium text-[13px] flex items-center justify-center gap-2 transition-all border border-transparent hover:border-white/10"
        >
          <Trash2 size={14} />
          Clear Context
        </motion.button>
      </div>
    </div>
  )
}
