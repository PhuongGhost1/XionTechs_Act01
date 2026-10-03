import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './command.css'
import App from './App.jsx'
import { startRuntime } from './state/runtime.js'

startRuntime()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
