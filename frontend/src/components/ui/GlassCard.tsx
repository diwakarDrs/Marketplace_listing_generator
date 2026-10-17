import { Box, type BoxProps } from '@chakra-ui/react'
import { motion, type TargetAndTransition } from 'framer-motion'
import type { ReactNode } from 'react'

const MotionBox = motion.create(Box)

interface GlassCardProps extends Omit<BoxProps, 'transition' | 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart'> {
  children: ReactNode
  whileHover?: TargetAndTransition
}

export function GlassCard({ children, whileHover = { scale: 1.02, y: -5 }, ...rest }: GlassCardProps) {
  return (
    <MotionBox
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={whileHover}
      p={6}
      rounded="2xl"
      bg="whiteAlpha.700"
      backdropFilter="blur(16px)"
      borderWidth="1px"
      borderColor="whiteAlpha.600"
      shadow="xl"
      {...rest}
    >
      {children}
    </MotionBox>
  )
}
