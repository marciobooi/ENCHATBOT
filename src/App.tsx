import './App.css'
import { useState, useRef } from 'react'
import ChatbotUI from './components/ChatbotUI'
import type { ChatbotUIHandlers } from './components/ChatbotUI'
import { Modal } from './components/Modal'
import { SkipLink } from './utils/accessibility-components'

function App() {
  const [isChatbotOpen, setIsChatbotOpen] = useState(false)
  const chatbotRef = useRef<ChatbotUIHandlers>(null)

  const openChatbot = () => setIsChatbotOpen(true)
  const closeChatbot = () => setIsChatbotOpen(false)

  return (
    <>
      <SkipLink href="#main-content">Skip to main content</SkipLink>
      <div className="app-container">
        <header className="app-header" role="banner">
          <h1>Eurostat Energy Dashboard</h1>
          <button
            className="chatbot-toggle"
            onClick={openChatbot}
            aria-label="Open chatbot"
            aria-describedby="chatbot-description"
          >
            💬 Chat with Eurostat AI
          </button>
          <div id="chatbot-description" className="sr-only">
            Opens a chatbot interface for querying Eurostat energy data
          </div>
        </header>

        <main id="main-content" className="app-main" role="main">
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
