import { Alert, Box, Button, Flex, Heading, SimpleGrid, Text } from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'
import { PageWrapper } from '../components/layout/PageWrapper'
import { MarketplaceBars, QuickActions, RecentListings, StatCard, UsageMeter } from '../components/dashboard'
import { GradientButton } from '../components/ui'
import { useDashboard } from '../hooks/useDashboard'

export default function DashboardPage() {
  const { stats, usage, isLoading, error, reload } = useDashboard()
  const isNewUser = !isLoading && !error && stats !== null && stats.total_listings === 0 && stats.total_products === 0

  return (
    <PageWrapper>
      <Flex direction="column" gap="6">
        <Heading size="2xl">Dashboard</Heading>

        {error ? (
          <Alert.Root status="error">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>{error}</Alert.Title>
            </Alert.Content>
            <Button size="sm" variant="outline" onClick={reload}>
              Retry
            </Button>
          </Alert.Root>
        ) : null}

        {isNewUser ? (
          <Box p="8" rounded="2xl" bg="glass" textAlign="center">
            <Heading size="lg">Welcome aboard</Heading>
            <Text mt="2" color="fg.muted">
              Add your first product and generate a listing to get started.
            </Text>
            <RouterLink to="/products/new">
              <GradientButton mt="4">Add your first product</GradientButton>
            </RouterLink>
          </Box>
        ) : null}

        <SimpleGrid columns={{ base: 1, md: 2 }} gap="4">
          <StatCard label="Products" value={stats?.total_products ?? 0} isLoading={isLoading} />
          <StatCard label="Listings" value={stats?.total_listings ?? 0} isLoading={isLoading} />
        </SimpleGrid>

        <UsageMeter usage={usage} isLoading={isLoading} />
        <QuickActions />

        <SimpleGrid columns={{ base: 1, lg: 2 }} gap="4">
          <RecentListings listings={stats?.recent_listings ?? []} isLoading={isLoading} />
          <MarketplaceBars data={stats?.listings_by_marketplace ?? {}} />
        </SimpleGrid>
      </Flex>
    </PageWrapper>
  )
}
