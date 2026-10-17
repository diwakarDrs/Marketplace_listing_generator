import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react'

const FONT_STACK = 'Inter, "Noto Sans", "Noto Sans Devanagari", "Noto Sans Tamil", sans-serif'
const BRAND_GRADIENT = 'linear-gradient(120deg, #7e22ce 0%, #db2777 55%, #f59e0b 100%)'

const config = defineConfig({
  globalCss: {
    html: { scrollBehavior: 'smooth' },
    body: { bg: 'purple.50', color: 'gray.800' },
    '::selection': { bg: 'purple.200', color: 'purple.900' },
    h1: {
      bgImage: BRAND_GRADIENT,
      bgClip: 'text',
      color: 'transparent',
      bgSize: '200% auto',
      animation: 'gradientShift 8s ease infinite',
      letterSpacing: '-0.02em',
      fontWeight: 'extrabold',
    },
    'button, a': {
      transitionProperty: 'transform, box-shadow, background-color, border-color, color, opacity',
      transitionDuration: '0.2s',
    },
    'button:not(:disabled):hover': { boxShadow: '0 6px 18px -6px rgba(147, 51, 234, 0.45)' },
    'input, textarea, select': {
      transitionProperty: 'box-shadow, border-color, background-color',
      transitionDuration: '0.2s',
    },
    'input:focus-visible, textarea:focus-visible, select:focus-visible': {
      borderColor: 'purple.400',
      boxShadow: '0 0 0 4px rgba(168, 85, 247, 0.18)',
      outline: 'none',
    },
    'tbody tr': { transition: 'background-color 0.2s ease' },
    'tbody tr:hover': { bg: 'purple.50' },
    '*::-webkit-scrollbar': { width: '10px', height: '10px' },
    '*::-webkit-scrollbar-thumb': { bg: 'purple.200', rounded: 'full' },
    '*::-webkit-scrollbar-thumb:hover': { bg: 'purple.300' },
    '*, *::before, *::after': {
      '@media (prefers-reduced-motion: reduce)': {
        animationDuration: '0.001ms !important',
        transitionDuration: '0.001ms !important',
      },
    },
  },
  theme: {
    keyframes: {
      gradientShift: {
        '0%': { backgroundPosition: '0% 50%' },
        '50%': { backgroundPosition: '100% 50%' },
        '100%': { backgroundPosition: '0% 50%' },
      },
      floatA: {
        '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
        '50%': { transform: 'translate(60px, 40px) scale(1.15)' },
      },
      floatB: {
        '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
        '50%': { transform: 'translate(-70px, -50px) scale(1.2)' },
      },
      shine: {
        '0%': { transform: 'translateX(-120%) skewX(-20deg)' },
        '100%': { transform: 'translateX(320%) skewX(-20deg)' },
      },
    },
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
