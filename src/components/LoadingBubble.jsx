import { motion } from 'framer-motion'

export default function LoadingBubble() {
  const dotVariants = {
    animate: (i) => ({
      opacity: [0.3, 1, 0.3],
      scale: [0.8, 1, 0.8],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        delay: i * 0.2,
      },
    }),
  }

  return (
    <div className="flex justify-start mb-10 w-full">
      <div className="flex items-center gap-3 bg-white/[0.02] border border-white/5 rounded-2xl px-6 py-4">
        <span className="text-[13px] font-medium text-white/40 tracking-wide">Processing query</span>
        <div className="flex items-center gap-1.5 ml-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              custom={i}
              animate="animate"
              variants={dotVariants}
              className="w-1.5 h-1.5 bg-cyan rounded-full shadow-[0_0_8px_rgba(6,182,212,0.8)]"
            />
          ))}
        </div>
      </div>
    </div>
  )
}
