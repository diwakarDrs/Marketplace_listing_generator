import { Badge, Button, Heading, HStack, Text, VStack } from '@chakra-ui/react'
import { Link } from 'react-router-dom'
import type { SellerProfile } from '../../types'
import { GlassCard } from '../ui/GlassCard'

interface SellerCardProps {
  seller: SellerProfile
  onDelete: (seller: SellerProfile) => void
}

export function SellerCard({ seller, onDelete }: SellerCardProps) {
  return (
    <GlassCard>
      <VStack align="stretch" gap={2}>
        <HStack justify="space-between" wrap="wrap">
          <Heading size="md">{seller.name}</Heading>
          {seller.default_marketplace && (
            <Badge colorPalette="purple" textTransform="capitalize">
              {seller.default_marketplace}
            </Badge>
          )}
        </HStack>
        {seller.brand_name && <Text fontWeight="medium">{seller.brand_name}</Text>}
        {seller.brand_voice && (
          <Text color="gray.600" lineClamp={2}>
            {seller.brand_voice}
          </Text>
        )}
        {seller.default_language && (
          <Text fontSize="sm" color="gray.500">
            Language: {seller.default_language}
          </Text>
        )}
        <HStack justify="flex-end" mt={2}>
          <Button asChild size="sm" variant="outline">
            <Link to={`/sellers/${seller.id}/edit`}>Edit</Link>
          </Button>
          <Button size="sm" colorPalette="red" variant="outline" onClick={() => onDelete(seller)}>
            Delete
          </Button>
        </HStack>
      </VStack>
    </GlassCard>
  )
}
