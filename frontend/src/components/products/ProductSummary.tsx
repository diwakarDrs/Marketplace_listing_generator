import { Badge, Heading, HStack, List, Text, VStack } from '@chakra-ui/react'
import type { Product } from '../../types'
import { GlassCard } from '../ui/GlassCard'

export function ProductSummary({ product }: { product: Product }) {
  const attributes = Object.entries(product.attributes ?? {})
  return (
    <GlassCard>
      <VStack align="stretch" gap={3}>
        <HStack justify="space-between" wrap="wrap">
          <Heading size="lg">{product.name}</Heading>
          {product.price !== null && <Badge colorPalette="green" fontSize="md">{product.price.toFixed(2)}</Badge>}
        </HStack>
        <HStack gap={4} wrap="wrap" color="gray.600">
          {product.category && <Text>Category: {product.category}</Text>}
          {product.brand && <Text>Brand: {product.brand}</Text>}
        </HStack>
        {product.target_audience && <Text>Audience: {product.target_audience}</Text>}
        {product.key_features.length > 0 && (
          <VStack align="stretch" gap={1}>
            <Text fontWeight="semibold">Key features</Text>
            <List.Root pl={5}>
              {product.key_features.map((f, i) => (
                <List.Item key={i}>{f}</List.Item>
              ))}
            </List.Root>
          </VStack>
        )}
        {attributes.length > 0 && (
          <VStack align="stretch" gap={1}>
            <Text fontWeight="semibold">Attributes</Text>
            {attributes.map(([k, v]) => (
              <Text key={k} fontSize="sm">
                {k}: {v}
              </Text>
            ))}
          </VStack>
        )}
      </VStack>
    </GlassCard>
  )
}
