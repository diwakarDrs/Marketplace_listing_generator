import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react'

const FONT_STACK = 'Inter, "Noto Sans", "Noto Sans Devanagari", "Noto Sans Tamil", sans-serif'

const config = defineConfig({
  theme: {
    tokens: {
      colors: {
        brand: {
          50: { value: '#faf5ff' },
          100: { value: '#f3e8ff' },
          200: { value: '#e9d5ff' },
          300: { value: '#d8b4fe' },
          400: { value: '#c084fc' },
          500: { value: '#a855f7' },
          600: { value: '#9333ea' },
          700: { value: '#7e22ce' },
          800: { value: '#6b21a8' },
          900: { value: '#581c87' },
        },
      },
      fonts: {
        heading: { value: FONT_STACK },
        body: { value: FONT_STACK },
      },
    },
  },
})

export const system = createSystem(defaultConfig, config)
