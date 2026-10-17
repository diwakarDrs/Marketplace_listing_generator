import { Box } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { Children, type ReactNode } from 'react'

const MotionBox = motion.create(Box)

const containerVariants = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }
const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }

export function AnimatedList({ children }: { children: ReactNode }) {
  return (
    <MotionBox initial="hidden" animate="visible" variants={containerVariants}>
      {Children.toArray(children).map((child, i) => (
        <MotionBox key={i} variants={itemVariants}>
          {child}
        </MotionBox>
      ))}
    </MotionBox>
  )
}
