import { Badge, Box, Flex, Heading, Skeleton, Text } from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'
import { GlassCard } from '../ui'
import type { Listing } from '../../types'

interface RecentListingsProps {
  listings: Listing[]
  isLoading?: boolean
}

export function RecentListings({ listings, isLoading = false }: RecentListingsProps) {
  return (
    <GlassCard>
      <Flex justify="space-between" align="center" mb="4">
        <Heading size="md">Recent listings</Heading>
        <RouterLink to="/listings">
          <Text fontSize="sm" color="accent" fontWeight="semibold">
            View all
          </Text>
        </RouterLink>
      </Flex>
      {isLoading ? (
        <Flex direction="column" gap="3">
          <Skeleton h="10" />
          <Skeleton h="10" />
          <Skeleton h="10" />
        </Flex>
      ) : listings.length === 0 ? (
        <Text color="fg.muted" fontSize="sm">
          Your generated listings will appear here.
        </Text>
      ) : (
        <Flex direction="column" gap="2">
          {listings.slice(0, 5).map((l) => (
            <RouterLink key={l.id} to={`/listings/${l.id}`}>
              <Flex justify="space-between" align="center" gap="3" p="2" rounded="lg" _hover={{ bg: 'blackAlpha.50' }}>
                <Box minW="0">
                  <Text fontWeight="medium" lineClamp={1}>
                    {l.title}
                  </Text>
                  <Text fontSize="xs" color="fg.muted" textTransform="capitalize">
                    {l.marketplace} · {new Date(l.created_at).toLocaleDateString()}
                  </Text>
                </Box>
                <Badge colorPalette={l.status === 'final' ? 'green' : 'gray'}>{l.status}</Badge>
              </Flex>
            </RouterLink>
          ))}
        </Flex>
      )}
    </GlassCard>
  )
}
