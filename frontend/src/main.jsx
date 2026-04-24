import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

/**
 * main.jsx - React Entry Point
 * 
 * This file is the entry point for the entire React application.
 * It mounts the root App component into the DOM.
 */

// Create root element and render App component
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
