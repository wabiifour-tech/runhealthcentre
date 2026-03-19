'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

// Helper to get initial theme from localStorage
function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light'
  try {
    const savedTheme = localStorage.getItem('ruhc_theme') as Theme | null
    return savedTheme || 'light'
  } catch {
    return 'light'
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Use lazy initializer to set theme from localStorage
  const [theme, setThemeState] = useState<Theme>(getInitialTheme)
  
  // Apply theme to DOM whenever it changes
  useEffect(() => {
    // Update DOM
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    
    // Persist to localStorage
    try {
      localStorage.setItem('ruhc_theme', theme)
    } catch {
      // Ignore localStorage errors
    }
  }, [theme])
  
  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme)
  }, [])
  
  const toggleTheme = useCallback(() => {
    setThemeState(prev => prev === 'light' ? 'dark' : 'light')
  }, [])
  
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
