import { motion } from 'framer-motion'

export default function StatusCard({ status, llmModel, embeddingsModel, vectorDb }) {
  const statusConfig = {
    connected: {
      color: 'text-white',
      dotColor: 'bg-emerald-500',
      dotShadow: 'shadow-[0_0_8px_rgba(16,185,129,0.8)]',
      label: 'Operational',
    },
    offline: {
      color: 'text-white/60',
      dotColor: 'bg-red-500',
      dotShadow: 'shadow-[0_0_8px_rgba(239,68,68,0.8)]',
      label: 'Offline',
    },
    checking: {
      color: 'text-white/60',
      dotColor: 'bg-amber-500',
      dotShadow: 'shadow-[0_0_8px_rgba(245,158,11,0.8)]',
      label: 'Initializing...',
    },
  }

  const config = statusConfig[status] || statusConfig.checking

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-4"
    >
      <div className="flex items-center gap-3">
        <motion.div
          animate={{
            scale: status === 'checking' ? [1, 1.5, 1] : 1,
            opacity: status === 'checking' ? [0.5, 1, 0.5] : 1,
          }}
          transition={{
            duration: 1.5,
            repeat: status === 'checking' ? Infinity : 0,
          }}
          className={`w-1.5 h-1.5 rounded-full ${config.dotColor} ${config.dotShadow}`}
        />
        <span className={`text-xs font-medium tracking-wide ${config.color}`}>{config.label}</span>
      </div>

      {status === 'connected' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          {llmModel && (
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-white/40">LLM</span>
              <span className="text-white/80 font-mono">{llmModel}</span>
            </div>
          )}
          {embeddingsModel && (
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-white/40">Embeddings</span>
              <span className="text-white/80 font-mono">{embeddingsModel}</span>
            </div>
          )}
          {vectorDb && (
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-white/40">Database</span>
              <span className="text-white/80 font-mono">{vectorDb}</span>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  )
}
