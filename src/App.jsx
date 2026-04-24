import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRagApi } from './hooks/useRagApi'
import Sidebar from './components/Sidebar'
import ChatArea from './components/ChatArea'

export default function App() {
  const [messages, setMessages] = useState([])
  const { apiStatus, isLoading, askQuestion } = useRagApi()

  const handleSendMessage = async (question) => {
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: question,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])

    try {
      const response = await askQuestion(question)
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: response.answer,
        grounded: response.grounded,
        verdict: response.verdict,
        sources: response.sources,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, aiMessage])
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: `Error: ${error.message}`,
        isError: true,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    }
  }

  const handleClearChat = () => {
    setMessages([])
  }

  return (
    <div className="relative flex h-screen w-screen bg-[#000000] overflow-hidden text-white selection:bg-cyan/30 selection:text-white">
      {/* Background layers */}
      <div className="absolute inset-0 bg-grid-white z-0" />
      <div className="absolute inset-0 bg-noise z-0 mix-blend-overlay" />
      
      {/* Subtle glowing orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-cyan/10 blur-[120px] z-0 pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple/10 blur-[120px] z-0 pointer-events-none" />

      {/* Main Content Area */}
      <div className="relative z-10 flex h-full w-full border-x border-white/[0.03] bg-[#09090b]/40 backdrop-blur-3xl shadow-2xl">
        {/* Sidebar */}
        <motion.div
          initial={{ x: -40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="hidden md:flex md:w-[280px] lg:w-[320px] border-r border-white/[0.05] flex-col bg-black/20"
        >
          <Sidebar
            apiStatus={apiStatus}
            onClearChat={handleClearChat}
            messageCount={messages.length}
          />
        </motion.div>

        {/* Chat Area */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="flex-1 flex flex-col overflow-hidden bg-transparent"
        >
          <ChatArea
            messages={messages}
            isLoading={isLoading}
            onSendMessage={handleSendMessage}
          />
        </motion.div>
      </div>
    </div>
  )
}
