import { Box, Heading, Progress, Skeleton, Text } from '@chakra-ui/react'
import { GlassCard } from '../ui'
import type { UsageInfo } from '../../types'

interface UsageMeterProps {
  usage: UsageInfo | null
  isLoading?: boolean
}

export function UsageMeter({ usage, isLoading = false }: UsageMeterProps) {
  const used = usage?.generations_used ?? 0
  const limit = usage?.generations_limit ?? 0
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0
  const palette = pct >= 90 ? 'red' : pct >= 70 ? 'orange' : 'purple'

  return (
    <GlassCard>
      <Heading size="md" mb="3">
        Monthly usage
      </Heading>
      {isLoading || !usage ? (
        <Box>
          <Skeleton h="4" mb="3" />
          <Skeleton h="3" w="40" />
        </Box>
      ) : (
        <Box>
          <Progress.Root value={pct} colorPalette={palette} size="lg" aria-label="Generations used">
            <Progress.Track rounded="full">
              <Progress.Range />
            </Progress.Track>
          </Progress.Root>
          <Text mt="3" fontSize="sm" color="gray.600">
            {used} of {limit} generations used ({usage.period})
          </Text>
        </Box>
      )}
    </GlassCard>
  )
}
