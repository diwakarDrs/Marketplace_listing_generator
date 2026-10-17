import { Box, Flex, Heading, Text } from '@chakra-ui/react'
import { GlassCard } from '../ui'

interface MarketplaceBarsProps {
  data: Record<string, number>
}

export function MarketplaceBars({ data }: MarketplaceBarsProps) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1])
  const max = entries.reduce((m, [, n]) => Math.max(m, n), 0)

  return (
    <GlassCard>
      <Heading size="md" mb="4">
        Listings by marketplace
      </Heading>
      {entries.length === 0 ? (
        <Text color="fg.muted" fontSize="sm">
          No listings yet.
        </Text>
      ) : (
        <Flex direction="column" gap="3">
          {entries.map(([name, count]) => (
            <Box key={name}>
              <Flex justify="space-between" fontSize="sm" mb="1">
                <Text textTransform="capitalize">{name}</Text>
                <Text fontWeight="semibold">{count}</Text>
              </Flex>
              <Box h="2" rounded="full" bg="trackBg">
                <Box
                  h="2"
                  rounded="full"
                  bgGradient="to-r"
                  gradientFrom="purple.500"
                  gradientTo="pink.500"
                  w={`${max > 0 ? Math.round((count / max) * 100) : 0}%`}
                />
              </Box>
            </Box>
          ))}
        </Flex>
      )}
    </GlassCard>
  )
}
