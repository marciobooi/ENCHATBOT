import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Import automated tests
import './tests/greetingTest';
import './tests/farewellTest';
import './tests/affirmativeNegativeTest';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
