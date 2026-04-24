import { motion } from 'framer-motion'
import { Sparkles, FileSearch, Fingerprint } from 'lucide-react'

export default function EmptyState({ onExampleClick }) {
  const examples = [
    { text: "Summarize the key findings from the latest report", icon: <FileSearch size={16} /> },
    { text: "What methodology was used in this research?", icon: <Fingerprint size={16} /> },
    { text: "Extract the core arguments about machine learning", icon: <Sparkles size={16} /> },
  ]

  return (
    <div className="flex flex-col items-center justify-center h-[60vh] max-w-2xl mx-auto text-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-8 relative group"
      >
        <div className="absolute inset-0 rounded-full bg-cyan/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        <Sparkles size={24} className="text-white/60 group-hover:text-cyan transition-colors duration-500 relative z-10" />
      </motion.div>
      
      <motion.h2 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.8 }}
        className="text-[28px] font-medium tracking-tight text-white/90 mb-4"
      >
        How can I help you explore your documents?
      </motion.h2>
      
      <motion.p 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8 }}
        className="text-[15px] text-white/40 mb-12 max-w-md"
      >
        I have ingested your knowledge base. Ask a question and I'll synthesize an answer using verified sources.
      </motion.p>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.8 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full"
      >
        {examples.map((example, index) => (
          <button
            key={index}
            onClick={() => onExampleClick(example.text)}
            className="flex flex-col items-start text-left gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/[0.04] transition-all group"
          >
            <div className="text-white/30 group-hover:text-cyan transition-colors">
              {example.icon}
            </div>
            <span className="text-[13px] leading-relaxed text-white/60 group-hover:text-white/90 transition-colors">
              {example.text}
            </span>
          </button>
        ))}
      </motion.div>
    </div>
  )
}
