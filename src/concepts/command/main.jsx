import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './command.css'
import CommandApp from './CommandApp.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <CommandApp />
  </StrictMode>,
)
