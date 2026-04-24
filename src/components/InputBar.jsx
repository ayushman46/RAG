import { useState } from 'react'
import { motion } from 'framer-motion'
import { Send } from 'lucide-react'

export default function InputBar({ onSendMessage, disabled }) {
  const [input, setInput] = useState('')
  const [isFocused, setIsFocused] = useState(false)

  const handleSend = () => {
    if (input.trim() && !disabled) {
      onSendMessage(input.trim())
      setInput('')
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="p-4 md:p-6 w-full max-w-3xl mx-auto space-y-3">
      <div className="flex gap-3 relative group">
        {/* Glow effect behind input */}
        <div className={`absolute inset-0 bg-cyan/10 blur-xl transition-opacity duration-500 rounded-2xl pointer-events-none ${isFocused ? 'opacity-100' : 'opacity-0'}`} />
        
        {/* Input Field */}
        <div className="flex-1 relative z-10">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Ask a question..."
            disabled={disabled}
            className="w-full px-5 py-4 bg-[#09090b]/80 backdrop-blur-xl border border-white/10 rounded-2xl text-[15px] text-white placeholder-white/30 focus:outline-none focus:border-cyan/40 focus:ring-1 focus:ring-cyan/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]"
          />
        </div>

        {/* Send Button */}
        <motion.button
          whileHover={{ scale: input.trim() && !disabled ? 1.02 : 1 }}
          whileTap={{ scale: input.trim() && !disabled ? 0.98 : 1 }}
          onClick={handleSend}
          disabled={!input.trim() || disabled}
          className={`relative z-10 px-6 rounded-2xl flex items-center justify-center transition-all duration-300 ${
            input.trim() && !disabled
              ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.2)] hover:shadow-[0_0_25px_rgba(255,255,255,0.4)]'
              : 'bg-white/5 text-white/20 border border-white/5 cursor-not-allowed'
          }`}
        >
          <Send size={18} className={input.trim() && !disabled ? "text-black" : ""} />
        </motion.button>
      </div>

      {/* Helper Text */}
      <div className="flex justify-between px-2 text-[10px] text-white/30 font-semibold tracking-widest uppercase">
        <span>Shift + Enter for newline</span>
        <span>RAG Pipeline</span>
      </div>
    </div>
  )
}
