import { Skeleton, Stat } from '@chakra-ui/react'
import { animate, motion, useMotionValue, useTransform } from 'framer-motion'
import { useEffect } from 'react'
import { GlassCard } from '../ui'

interface StatCardProps {
  label: string
  value: number | string
  isLoading?: boolean
}

function CountUp({ value }: { value: number }) {
  const mv = useMotionValue(0)
  const rounded = useTransform(mv, (v) => Math.round(v).toString())
  useEffect(() => {
    const controls = animate(mv, value, { duration: 1.1, ease: 'easeOut' })
    return () => controls.stop()
  }, [mv, value])
  return <motion.span>{rounded}</motion.span>
}

export function StatCard({ label, value, isLoading = false }: StatCardProps) {
  return (
    <GlassCard
      overflow="hidden"
      _before={{
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        h: '4px',
        bgImage: 'linear-gradient(90deg, #9333ea, #ec4899, #f59e0b)',
      }}
    >
      <Stat.Root>
        <Stat.Label color="fg.muted" fontWeight="medium" textTransform="uppercase" letterSpacing="wider" fontSize="xs">
          {label}
        </Stat.Label>
        {isLoading ? (
          <Skeleton h="9" w="20" mt="1" />
        ) : (
          <Stat.ValueText
            fontSize="4xl"
            fontWeight="extrabold"
            bgImage="var(--grad-stat)"
            bgClip="text"
            color="transparent"
          >
            {typeof value === 'number' ? <CountUp value={value} /> : value}
          </Stat.ValueText>
        )}
      </Stat.Root>
    </GlassCard>
  )
}
