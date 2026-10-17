import { Box, Button, type ButtonProps } from '@chakra-ui/react'
import { motion } from 'framer-motion'

const MotionButton = motion.create(Button)

type GradientButtonProps = Omit<ButtonProps, 'transition' | 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart'>

export function GradientButton({ children, ...rest }: GradientButtonProps) {
  return (
    <MotionButton
      whileHover={{ scale: 1.04, y: -2 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 400, damping: 18 }}
      position="relative"
      overflow="hidden"
      px={6}
      rounded="full"
      fontWeight="semibold"
      color="white"
      bgImage="linear-gradient(120deg, #9333ea, #ec4899, #f59e0b, #9333ea)"
      bgSize="300% 100%"
      animation="gradientShift 6s ease infinite"
      shadow="0 8px 20px -8px rgba(219, 39, 119, 0.55)"
      _hover={{ shadow: '0 14px 30px -8px rgba(219, 39, 119, 0.7)', '& .shine': { animation: 'shine 0.9s ease' } }}
      {...rest}
    >
      <Box
        className="shine"
        aria-hidden="true"
        position="absolute"
        top={0}
        bottom={0}
        left={0}
        w="30%"
        bg="whiteAlpha.500"
        transform="translateX(-120%) skewX(-20deg)"
        pointerEvents="none"
      />
      {children}
    </MotionButton>
  )
}
