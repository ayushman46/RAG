import { motion } from 'framer-motion'

/**
 * LoadingBubble.jsx - Animated Typing Indicator Component
 * 
 * Shows a glass card with three pulsing dots animation while
 * the API is processing the user's question.
 * 
 * Features:
 *   1. Three dots that pulse in staggered sequence
 *   2. Glass card styling matching AI message bubbles
 *   3. "Searching documents..." text below dots
 *   4. Smooth spring animations
 */

export default function LoadingBubble() {
  /**
   * Animation for individual dot pulsing
   * Each dot scales up and down while opacity changes
   */
  const dotVariants = {
    initial: { opacity: 0.4, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
  }

  /**
   * Container animation with staggered children
   * Dots pulse one after another for smooth typing effect
   */
  const containerVariants = {
    animate: {
      transition: {
        staggerChildren: 0.2,
        repeat: Infinity,
      },
    },
  }

  return (
    <motion.div
      className="flex justify-start"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: 'spring', damping: 12, stiffness: 100 }}
    >
      {/* Glass card bubble for loading state */}
      <div className="max-w-xs rounded-lg rounded-bl-none bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 p-4 flex flex-col gap-3">
        {/* Container for three pulsing dots */}
        <motion.div
          className="flex gap-2 items-center"
          variants={containerVariants}
          animate="animate"
        >
          {/* First dot */}
          <motion.div
            className="w-2 h-2 bg-cyan-400 rounded-full"
            variants={dotVariants}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              repeatType: 'reverse',
            }}
          />

          {/* Second dot */}
          <motion.div
            className="w-2 h-2 bg-cyan-400 rounded-full"
            variants={dotVariants}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              repeatType: 'reverse',
              delay: 0.2,
            }}
          />

          {/* Third dot */}
          <motion.div
            className="w-2 h-2 bg-cyan-400 rounded-full"
            variants={dotVariants}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              repeatType: 'reverse',
              delay: 0.4,
            }}
          />
        </motion.div>

        {/* Text below dots indicating system is searching */}
        <p className="text-sm text-slate-400 font-medium">
          Searching documents...
        </p>
      </div>
    </motion.div>
  )
}
