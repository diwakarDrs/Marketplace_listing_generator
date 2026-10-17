import { Skeleton, Stat } from '@chakra-ui/react'
import { GlassCard } from '../ui'

interface StatCardProps {
  label: string
  value: number | string
  isLoading?: boolean
}

export function StatCard({ label, value, isLoading = false }: StatCardProps) {
  return (
    <GlassCard>
      <Stat.Root>
        <Stat.Label color="gray.600">{label}</Stat.Label>
        {isLoading ? (
          <Skeleton h="9" w="20" mt="1" />
        ) : (
          <Stat.ValueText fontSize="3xl" fontWeight="bold">
            {value}
          </Stat.ValueText>
        )}
      </Stat.Root>
    </GlassCard>
  )
}
