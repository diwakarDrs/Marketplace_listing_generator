import { useContext } from 'react'
import { ColorModeContext, type ColorModeContextType } from '../context/colorModeContextValue'

export function useColorMode(): ColorModeContextType {
  const ctx = useContext(ColorModeContext)
  if (!ctx) {
    throw new Error('useColorMode must be used within ColorModeProvider')
  }
  return ctx
}
