import { Badge, Box, Table, Text } from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'
import type { Language, Listing, Marketplace } from '../../types'

interface ListingTableProps {
  listings: Listing[]
  productNames: ReadonlyMap<number, string>
  marketplaces: Marketplace[]
  languages: Language[]
}

export function ListingTable({ listings, productNames, marketplaces, languages }: ListingTableProps) {
  const productName = (id: number): string => productNames.get(id) ?? `Product #${id}`
  const marketplaceName = (id: string): string => marketplaces.find((m) => m.id === id)?.name ?? id
  const languageName = (code: string): string => languages.find((l) => l.code === code)?.name ?? code

  return (
    <Box overflowX="auto">
      <Table.Root size="md" variant="outline">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>Title</Table.ColumnHeader>
            <Table.ColumnHeader>Product</Table.ColumnHeader>
            <Table.ColumnHeader>Marketplace</Table.ColumnHeader>
            <Table.ColumnHeader>Language</Table.ColumnHeader>
            <Table.ColumnHeader>Status</Table.ColumnHeader>
            <Table.ColumnHeader>Created</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {listings.map((l) => (
            <Table.Row key={l.id} _hover={{ bg: 'purple.50' }}>
              <Table.Cell maxW="360px">
                <RouterLink to={`/listings/${l.id}`}>
                  <Text color="purple.700" fontWeight="medium" lineClamp={2}>
                    {l.title || 'Untitled listing'}
                  </Text>
                </RouterLink>
                {l.validation_warnings.length > 0 && (
                  <Badge colorPalette="orange" mt={1}>
                    {l.validation_warnings.length} warning{l.validation_warnings.length > 1 ? 's' : ''}
                  </Badge>
                )}
              </Table.Cell>
              <Table.Cell>{productName(l.product_id)}</Table.Cell>
              <Table.Cell>
                <Badge colorPalette="purple">{marketplaceName(l.marketplace)}</Badge>
              </Table.Cell>
              <Table.Cell>{languageName(l.language)}</Table.Cell>
              <Table.Cell>
                <Badge colorPalette={l.status === 'final' ? 'green' : 'gray'}>{l.status}</Badge>
              </Table.Cell>
              <Table.Cell>{new Date(l.created_at).toLocaleDateString()}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Box>
  )
}
