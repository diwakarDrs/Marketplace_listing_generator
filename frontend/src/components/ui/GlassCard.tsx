import { Box, type BoxProps } from '@chakra-ui/react'
import { motion, type TargetAndTransition } from 'framer-motion'
import type { ReactNode } from 'react'

const MotionBox = motion.create(Box)

interface GlassCardProps extends Omit<BoxProps, 'transition' | 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart'> {
  children: ReactNode
  whileHover?: TargetAndTransition
}

export function GlassCard({ children, whileHover = { y: -4, scale: 1.01 }, ...rest }: GlassCardProps) {
  return (
    <MotionBox
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 220, damping: 22 }}
      whileHover={whileHover}
      position="relative"
      p={6}
      rounded="2xl"
      bg="whiteAlpha.800"
      backdropFilter="blur(18px) saturate(160%)"
      borderWidth="1px"
      borderColor="whiteAlpha.700"
      shadow="0 10px 30px -12px rgba(124, 58, 237, 0.25)"
      _hover={{ shadow: '0 24px 48px -16px rgba(168, 85, 247, 0.45)', borderColor: 'purple.200' }}
      {...rest}
    >
      {children}
    </MotionBox>
  )
}
