import './App.css'
import { useState, useRef } from 'react'
import ChatbotUI from './components/ChatbotUI'
import type { ChatbotUIHandlers } from './components/ChatbotUI'
import { Modal } from './components/Modal'

function App() {
  const [isChatbotOpen, setIsChatbotOpen] = useState(false)
  const chatbotRef = useRef<ChatbotUIHandlers>(null)

  const openChatbot = () => setIsChatbotOpen(true)
  const closeChatbot = () => setIsChatbotOpen(false)

  return (
    <>
      <div className="app-container">
        <header className="app-header">
          <h1>Eurostat Energy Dashboard</h1>
          <button
            className="chatbot-toggle"
            onClick={openChatbot}
            aria-label="Open chatbot"
          >
            💬 Chat with Eurostat AI
          </button>
        </header>

        <main className="app-main">
          <div className="dashboard-placeholder">
            <h2>Welcome to Eurostat Energy Data</h2>
            <p>Click the chat button above to interact with our AI assistant for energy data queries.</p>
          </div>
        </main>
      </div>

      <Modal
        isOpen={isChatbotOpen}
        onClose={closeChatbot}
        onSend={() => chatbotRef.current?.handleSend()}
        onClear={() => chatbotRef.current?.clearInput()}
        onNavigateHistory={(direction) => chatbotRef.current?.navigateHistory(direction)}
        onFocusInput={() => chatbotRef.current?.focusInput()}
      >
        <ChatbotUI ref={chatbotRef} onClose={closeChatbot} />
      </Modal>
    </>
  )
}

export default App
