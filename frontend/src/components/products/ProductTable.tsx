import { Box, Button, HStack, Table, Text } from '@chakra-ui/react'
import { Link } from 'react-router-dom'
import type { Product } from '../../types'

interface ProductTableProps {
  products: Product[]
  onDelete: (product: Product) => void
}

export function ProductTable({ products, onDelete }: ProductTableProps) {
  return (
    <Box overflowX="auto" rounded="2xl" bg="glass" borderWidth="1px" borderColor="glassBorder">
      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>Name</Table.ColumnHeader>
            <Table.ColumnHeader>Category</Table.ColumnHeader>
            <Table.ColumnHeader>Brand</Table.ColumnHeader>
            <Table.ColumnHeader textAlign="end">Price</Table.ColumnHeader>
            <Table.ColumnHeader textAlign="end">Actions</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {products.map((p) => (
            <Table.Row key={p.id}>
              <Table.Cell>
                <Link to={`/products/${p.id}`}>
                  <Text fontWeight="semibold" color="accent">
                    {p.name}
                  </Text>
                </Link>
              </Table.Cell>
              <Table.Cell>{p.category ?? '-'}</Table.Cell>
              <Table.Cell>{p.brand ?? '-'}</Table.Cell>
              <Table.Cell textAlign="end">{p.price !== null ? p.price.toFixed(2) : '-'}</Table.Cell>
              <Table.Cell>
                <HStack justify="flex-end">
                  <Button asChild size="xs" variant="outline">
                    <Link to={`/products/${p.id}/edit`}>Edit</Link>
                  </Button>
                  <Button size="xs" variant="outline" colorPalette="red" onClick={() => onDelete(p)}>
                    Delete
                  </Button>
                </HStack>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Box>
  )
}
