import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { ColorModeContext, type ColorMode } from './colorModeContextValue'

const STORAGE_KEY = 'color-mode'

function readInitialMode(): ColorMode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    // storage unavailable; fall back to the OS preference
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ColorModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ColorMode>(readInitialMode)

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', mode === 'dark')
    root.classList.toggle('light', mode === 'light')
    root.style.colorScheme = mode
    try {
      localStorage.setItem(STORAGE_KEY, mode)
    } catch {
      // ignore persistence failures
    }
  }, [mode])

  const toggle = useCallback((): void => setMode((m) => (m === 'dark' ? 'light' : 'dark')), [])
  const value = useMemo(() => ({ mode, toggle }), [mode, toggle])

  return <ColorModeContext.Provider value={value}>{children}</ColorModeContext.Provider>
}
