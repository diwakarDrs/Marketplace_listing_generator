import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react'

const FONT_STACK = 'Inter, "Noto Sans", "Noto Sans Devanagari", "Noto Sans Tamil", sans-serif'

const config = defineConfig({
  globalCss: {
    html: {
      scrollBehavior: 'smooth',
      '--grad-text': 'linear-gradient(120deg, #7e22ce 0%, #db2777 55%, #f59e0b 100%)',
      '--grad-stat': 'linear-gradient(120deg, #7e22ce, #db2777)',
    },
    'html.dark': {
      '--grad-text': 'linear-gradient(120deg, #c084fc 0%, #f472b6 55%, #fbbf24 100%)',
      '--grad-stat': 'linear-gradient(120deg, #d8b4fe, #f9a8d4)',
    },
    body: { bg: 'pageBg', color: 'fg', transition: 'background-color 0.3s ease, color 0.3s ease' },
    '::selection': { bg: 'purple.200', color: 'purple.900' },
    h1: {
      bgImage: 'var(--grad-text)',
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
    'tbody tr:hover': { bg: 'rowHover' },
    '*::-webkit-scrollbar': { width: '10px', height: '10px' },
    '*::-webkit-scrollbar-thumb': { bg: 'scrollThumb', rounded: 'full' },
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
    semanticTokens: {
      colors: {
        pageBg: { value: { _light: '{colors.purple.50}', _dark: '#0f0b1a' } },
        glass: { value: { _light: 'rgba(255,255,255,0.8)', _dark: 'rgba(28,22,46,0.72)' } },
        glassBorder: { value: { _light: 'rgba(255,255,255,0.7)', _dark: 'rgba(168,85,247,0.22)' } },
        glassHoverBorder: { value: { _light: '{colors.purple.200}', _dark: '{colors.purple.400}' } },
        navBorder: { value: { _light: '{colors.purple.100}', _dark: 'rgba(168,85,247,0.25)' } },
        rowHover: { value: { _light: '{colors.purple.50}', _dark: 'rgba(168,85,247,0.12)' } },
        scrollThumb: { value: { _light: '{colors.purple.200}', _dark: '{colors.purple.800}' } },
        accent: { value: { _light: '{colors.purple.600}', _dark: '{colors.purple.300}' } },
        accentStrong: { value: { _light: '{colors.purple.700}', _dark: '{colors.purple.200}' } },
        trackBg: { value: { _light: 'rgba(0,0,0,0.08)', _dark: 'rgba(255,255,255,0.1)' } },
        meshFrom: { value: { _light: '{colors.purple.50}', _dark: '#0f0b1a' } },
        meshVia: { value: { _light: '#ffffff', _dark: '#150f26' } },
        meshTo: { value: { _light: '{colors.pink.50}', _dark: '#1d1030' } },
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
