import { createContext } from 'react'

export type ColorMode = 'light' | 'dark'

export interface ColorModeContextType {
  mode: ColorMode
  toggle: () => void
}

export const ColorModeContext = createContext<ColorModeContextType | null>(null)
