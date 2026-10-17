import { Heading, SimpleGrid, Text } from '@chakra-ui/react'
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
            <Heading size="md" color="purple.700">
              {a.title}
            </Heading>
            <Text mt="1" fontSize="sm" color="gray.600">
              {a.description}
            </Text>
          </GlassCard>
        </RouterLink>
      ))}
    </SimpleGrid>
  )
}
