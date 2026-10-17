import { Button, type ButtonProps } from '@chakra-ui/react'
import { motion } from 'framer-motion'

const MotionButton = motion.create(Button)

type GradientButtonProps = Omit<ButtonProps, 'transition' | 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart'>

export function GradientButton({ children, ...rest }: GradientButtonProps) {
  return (
    <MotionButton
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      px={6}
      rounded="full"
      fontWeight="semibold"
      color="white"
      bgGradient="to-r"
      gradientFrom="purple.500"
      gradientTo="pink.500"
      _hover={{ shadow: 'lg' }}
      {...rest}
    >
      {children}
    </MotionButton>
  )
}
