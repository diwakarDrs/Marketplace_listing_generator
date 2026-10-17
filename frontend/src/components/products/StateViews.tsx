import { Button, Center, Heading, Spinner, Text, VStack } from '@chakra-ui/react'
import type { ReactNode } from 'react'
import { GlassCard } from '../ui/GlassCard'

export function LoadingView() {
  return (
    <Center py={16}>
      <Spinner size="xl" color="purple.500" />
    </Center>
  )
}

export function ErrorView({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <GlassCard>
      <VStack gap={3}>
        <Text color="red.fg" role="alert">
          {message}
        </Text>
        {onRetry && (
          <Button variant="outline" onClick={onRetry}>
            Retry
          </Button>
        )}
      </VStack>
    </GlassCard>
  )
}

export function EmptyView({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <GlassCard>
      <VStack gap={3} py={8}>
        <Heading size="md">{title}</Heading>
        <Text color="fg.muted" textAlign="center">
          {description}
        </Text>
        {action}
      </VStack>
    </GlassCard>
  )
}
