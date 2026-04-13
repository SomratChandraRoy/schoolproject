import React from 'react'
import ReactDOM from 'react-dom/client'
import { BlinkUIProvider } from '@blinkdotnew/ui'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BlinkUIProvider theme="linear" darkMode="light">
      <App />
    </BlinkUIProvider>
  </React.StrictMode>,
)
