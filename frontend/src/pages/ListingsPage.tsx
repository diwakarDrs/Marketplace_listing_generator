import { useState } from 'react'
import { Alert, Button, Center, Heading, HStack, Spinner, Stack, Text } from '@chakra-ui/react'
import { Link as RouterLink, useSearchParams } from 'react-router-dom'
import { Panel } from '../components/listings/Panel'
import { PageWrapper } from '../components/layout/PageWrapper'
import { Filters, type ListingFilterValues } from '../components/listings/Filters'
import { ListingTable } from '../components/listings/ListingTable'
import { Pager } from '../components/products/Pager'
import { useListings, useMarketplaces } from '../hooks/useListings'
import { useProductNames } from '../hooks/useProductNames'

export default function ListingsPage() {
  const [searchParams] = useSearchParams()
  const initialProduct = Number(searchParams.get('productId'))
  const [filters, setFilters] = useState<ListingFilterValues>({
    productId: Number.isInteger(initialProduct) && initialProduct > 0 ? initialProduct : null,
    marketplace: '',
    language: '',
  })
  const [page, setPage] = useState<number>(1)
  const listings = useListings({
    page,
    product_id: filters.productId ?? undefined,
    marketplace: filters.marketplace || undefined,
    language: filters.language || undefined,
  })
  const meta = useMarketplaces()
  const productNames = useProductNames(listings.data.items.map((l) => l.product_id))

  return (
    <PageWrapper>
      <Stack gap={6}>
        <HStack justify="space-between" wrap="wrap">
          <Heading size="2xl">Listings</Heading>
          <Button asChild colorPalette="purple" rounded="full">
            <RouterLink to="/generate">New listing</RouterLink>
          </Button>
        </HStack>

        <Panel>
          <Filters
            values={filters}
            onChange={(values) => {
              setFilters(values)
              setPage(1)
            }}
            marketplaces={meta.data?.marketplaces ?? []}
            languages={meta.data?.languages ?? []}
          />
        </Panel>

        <Panel>
          {listings.loading ? (
            <Center py={10}>
              <Spinner color="purple.500" size="lg" />
            </Center>
          ) : listings.error ? (
            <Alert.Root status="error">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Title>Could not load listings</Alert.Title>
                <Alert.Description>{listings.error.message}</Alert.Description>
              </Alert.Content>
              <Button size="sm" variant="outline" onClick={listings.reload}>
                Retry
              </Button>
            </Alert.Root>
          ) : listings.data.items.length === 0 ? (
            <Stack align="center" py={10} gap={3}>
              <Text color="fg.muted">No listings found.</Text>
              <Button asChild colorPalette="purple" variant="outline">
                <RouterLink to="/generate">Generate your first listing</RouterLink>
              </Button>
            </Stack>
          ) : (
            <>
              <ListingTable
                listings={listings.data.items}
                productNames={productNames}
                marketplaces={meta.data?.marketplaces ?? []}
                languages={meta.data?.languages ?? []}
              />
              <Pager page={listings.data.page} pageSize={listings.data.page_size} total={listings.data.total} onPage={setPage} />
            </>
          )}
        </Panel>
      </Stack>
    </PageWrapper>
  )
}
