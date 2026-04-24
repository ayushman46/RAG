import { motion } from 'framer-motion'
import { Server, Cpu, Database, CheckCircle, AlertCircle } from 'lucide-react'

/**
 * StatusCard.jsx - Backend Health and Model Info Display
 * 
 * Shows:
 *   1. Connection status (green dot + Connected, red dot + Offline)
 *   2. Which LLM model is running
 *   3. Which embedding model is running
 *   4. Which vector database is being used
 * 
 * The component receives apiStatus from the parent (App.jsx)
 * and displays it with appropriate icons and colors
 */

export default function StatusCard({ apiStatus }) {
  /**
   * Determine the status display based on apiStatus
   * apiStatus can be: 'checking', 'connected', or 'offline'
   */
  const statusConfig = {
    checking: {
      label: 'Checking...',
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-400/10',
      dotColor: 'bg-yellow-400',
      icon: AlertCircle,
    },
    connected: {
      label: 'Connected',
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-400/10',
      dotColor: 'bg-emerald-400',
      icon: CheckCircle,
    },
    offline: {
      label: 'Offline',
      color: 'text-red-400',
      bgColor: 'bg-red-400/10',
      dotColor: 'bg-red-400',
      icon: AlertCircle,
    },
  }

  // Get the current status config
  const current = statusConfig[apiStatus] || statusConfig.checking
  const StatusIcon = current.icon

  /**
   * Animation for the status card fade-in
   */
  const cardVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  }

  /**
   * Animation for the pulsing status dot when checking
   */
  const pulseVariants = {
    animate: {
      scale: [1, 1.2, 1],
      opacity: [1, 0.7, 1],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  }

  return (
    <motion.div
      className="p-4 rounded-lg bg-gradient-to-br from-slate-800/50 to-slate-800/30 border border-slate-700/50 space-y-3"
      variants={cardVariants}
      initial="hidden"
      animate="visible"
    >
      {/* BACKEND STATUS - Connection indicator */}
      <div className="flex items-center gap-3">
        {/* Status icon with pulse animation if checking */}
        <motion.div
          className="relative"
          variants={apiStatus === 'checking' ? pulseVariants : {}}
          animate={apiStatus === 'checking' ? 'animate' : ''}
        >
          <StatusIcon className={`w-4 h-4 ${current.color}`} />
        </motion.div>

        {/* Status label and color */}
        <div className="flex-1">
          <p className="text-xs text-slate-400 font-medium">Backend</p>
          <p className={`text-sm font-semibold ${current.color}`}>
            {current.label}
          </p>
        </div>
      </div>

      {/* Model info divider */}
      <div className="h-px bg-slate-700/50" />

      {/* LLM MODEL - Which language model is running */}
      <div className="flex items-center gap-3">
        {/* CPU icon for the LLM */}
        <Cpu className="w-4 h-4 text-purple-400 flex-shrink-0" />

        <div className="flex-1">
          {/* Label */}
          <p className="text-xs text-slate-400 font-medium">LLM Model</p>
          {/* Model name */}
          <p className="text-sm text-slate-200 font-medium">llama3.2</p>
          {/* Subtext showing it's local */}
          <p className="text-xs text-slate-500">(local)</p>
        </div>
      </div>

      {/* EMBEDDING MODEL - Which embedding model is running */}
      <div className="flex items-center gap-3">
        {/* Nodes icon for embeddings */}
        <Cpu className="w-4 h-4 text-cyan-400 flex-shrink-0" />

        <div className="flex-1">
          {/* Label */}
          <p className="text-xs text-slate-400 font-medium">Embeddings</p>
          {/* Model name */}
          <p className="text-sm text-slate-200 font-medium">nomic-embed-text</p>
          {/* Subtext showing it's local */}
          <p className="text-xs text-slate-500">(local)</p>
        </div>
      </div>

      {/* VECTOR DATABASE - Which database we're using */}
      <div className="flex items-center gap-3">
        {/* Database icon */}
        <Database className="w-4 h-4 text-violet-400 flex-shrink-0" />

        <div className="flex-1">
          {/* Label */}
          <p className="text-xs text-slate-400 font-medium">Vector DB</p>
          {/* Database name */}
          <p className="text-sm text-slate-200 font-medium">ChromaDB</p>
          {/* Subtext showing persistence */}
          <p className="text-xs text-slate-500">(persisted)</p>
        </div>
      </div>
    </motion.div>
  )
}
