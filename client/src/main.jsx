import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'


// STRICT DEBUGGING: Print all env vars immediately
console.log("🔍 ENV CHECK:", {
  URL: import.meta.env.VITE_SUPABASE_URL,
  KEY_EXISTS: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
  GA_ID: import.meta.env.VITE_GOOGLE_ANALYTICS_ID
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
