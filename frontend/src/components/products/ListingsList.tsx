import { Badge, Heading, HStack, Text, VStack } from '@chakra-ui/react'
import { Link } from 'react-router-dom'
import type { Listing } from '../../types'
import { AnimatedList } from '../ui/AnimatedList'
import { GlassCard } from '../ui/GlassCard'

export function ListingsList({ listings }: { listings: Listing[] }) {
  return (
    <AnimatedList>
      {listings.map((l) => (
        <Link key={l.id} to={`/listings/${l.id}`}>
          <GlassCard mb={3} p={4}>
            <VStack align="stretch" gap={1}>
              <HStack justify="space-between" wrap="wrap">
                <Heading size="sm" lineClamp={1}>
                  {l.title}
                </Heading>
                <HStack>
                  <Badge colorPalette="purple" textTransform="capitalize">
                    {l.marketplace}
                  </Badge>
                  <Badge colorPalette={l.status === 'final' ? 'green' : 'gray'}>{l.status}</Badge>
                </HStack>
              </HStack>
              <Text fontSize="sm" color="fg.subtle">
                {l.language} - {new Date(l.created_at).toLocaleDateString()}
              </Text>
            </VStack>
          </GlassCard>
        </Link>
      ))}
    </AnimatedList>
  )
}
