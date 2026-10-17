import { Heading, Text } from '@chakra-ui/react'
import { PageWrapper } from '../layout/PageWrapper'
import { GlassCard } from './GlassCard'

interface PagePlaceholderProps {
  title: string
  description?: string
}

export function PagePlaceholder({ title, description }: PagePlaceholderProps) {
  return (
    <PageWrapper>
      <GlassCard>
        <Heading size="lg" mb={2}>
          {title}
        </Heading>
        <Text color="gray.600">{description ?? 'This page is under construction.'}</Text>
      </GlassCard>
    </PageWrapper>
  )
}
