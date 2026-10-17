import { IconButton, type IconButtonProps } from '@chakra-ui/react'
import { AnimatePresence, motion } from 'framer-motion'
import { useColorMode } from '../../hooks/useColorMode'

const MotionSpan = motion.span

export function ColorModeToggle(props: Omit<IconButtonProps, 'aria-label'>) {
  const { mode, toggle } = useColorMode()
  const isDark = mode === 'dark'
  return (
    <IconButton
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      onClick={toggle}
      variant="ghost"
      rounded="full"
      size="sm"
      overflow="hidden"
      {...props}
    >
      <AnimatePresence mode="wait" initial={false}>
        <MotionSpan
          key={mode}
          initial={{ rotate: -90, scale: 0.4, opacity: 0 }}
          animate={{ rotate: 0, scale: 1, opacity: 1 }}
          exit={{ rotate: 90, scale: 0.4, opacity: 0 }}
          transition={{ duration: 0.2 }}
          aria-hidden="true"
        >
          {isDark ? '☀️' : '🌙'}
        </MotionSpan>
      </AnimatePresence>
    </IconButton>
  )
}
