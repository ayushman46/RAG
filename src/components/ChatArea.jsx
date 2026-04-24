import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import MessageBubble from './MessageBubble'
import LoadingBubble from './LoadingBubble'
import InputBar from './InputBar'
import EmptyState from './EmptyState'

export default function ChatArea({ messages, isLoading, onSendMessage }) {
  const scrollContainerRef = useRef(null)
  const [showCopyFeedback, setShowCopyFeedback] = useState(false)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollContainerRef.current) {
      setTimeout(() => {
        scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight
      }, 100)
    }
  }, [messages, isLoading])

  return (
    <div className="flex flex-col h-full w-full relative">
      {/* Messages Container */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-4 py-8 md:px-8 space-y-6 scroll-smooth"
      >
        <div className="max-w-3xl mx-auto w-full">
          <AnimatePresence mode="wait">
            {messages.length === 0 ? (
              <EmptyState onExampleClick={onSendMessage} />
            ) : (
              <div className="space-y-8">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <MessageBubble
                      message={message}
                      onCopySource={() => setShowCopyFeedback(true)}
                    />
                  </motion.div>
                ))}
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <LoadingBubble />
                  </motion.div>
                )}
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Input Bar Layer */}
      <div className="w-full bg-gradient-to-t from-[#000000] via-[#000000]/80 to-transparent pt-10 pb-4">
        <InputBar onSendMessage={onSendMessage} disabled={isLoading} />
      </div>

      {/* Copy Feedback */}
      <AnimatePresence>
        {showCopyFeedback && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-32 left-1/2 -translate-x-1/2 bg-white text-black px-4 py-2 rounded-full text-[13px] font-medium shadow-[0_0_20px_rgba(255,255,255,0.2)]"
            onAnimationComplete={() => {
              setTimeout(() => setShowCopyFeedback(false), 2000)
            }}
          >
            Copied to clipboard
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
