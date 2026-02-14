// import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from "next-themes";
import { AuthProvider } from './hooks/use-auth.tsx';
import { TooltipProvider } from "@/components/ui/tooltip"


createRoot(document.getElementById('root')!).render(
  // <StrictMode>

  <ThemeProvider attribute="class" defaultTheme="light">
    <AuthProvider>
      <TooltipProvider>
        <App />
      </TooltipProvider>
    </AuthProvider>
  </ThemeProvider>
  // </StrictMode>,
)
