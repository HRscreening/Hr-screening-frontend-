// import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from "next-themes";
import { AuthProvider } from './hooks/use-auth.tsx';

createRoot(document.getElementById('root')!).render(
  // <StrictMode>

    <ThemeProvider attribute="class" defaultTheme="light">
      <AuthProvider>
        <App />
      </AuthProvider>
    </ThemeProvider>
  // </StrictMode>,
)
