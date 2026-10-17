import { Heading, HStack, SimpleGrid, Text } from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'
import { GlassCard } from '../ui'

interface ActionDef {
  to: string
  title: string
  description: string
}

const ACTIONS: ActionDef[] = [
  { to: '/generate', title: 'Generate a listing', description: 'Create marketplace-ready copy with AI.' },
  { to: '/products/new', title: 'Add a product', description: 'Save product details to reuse across listings.' },
]

export function QuickActions() {
  return (
    <SimpleGrid columns={{ base: 1, md: 2 }} gap="4">
      {ACTIONS.map((a) => (
        <RouterLink key={a.to} to={a.to}>
          <GlassCard h="full">
            <HStack justify="space-between">
              <Heading size="md" color="purple.700">
                {a.title}
              </Heading>
              <Text color="pink.500" fontSize="xl" aria-hidden="true">
                →
              </Text>
            </HStack>
            <Text mt="1" fontSize="sm" color="gray.600">
              {a.description}
            </Text>
          </GlassCard>
        </RouterLink>
      ))}
    </SimpleGrid>
  )
}
