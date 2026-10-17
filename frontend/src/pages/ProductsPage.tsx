import { Button, Heading, HStack, NativeSelect } from '@chakra-ui/react'
import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageWrapper } from '../components/layout/PageWrapper'
import { ConfirmDialog } from '../components/products/ConfirmDialog'
import { Pager } from '../components/products/Pager'
import { ProductTable } from '../components/products/ProductTable'
import { SearchBar } from '../components/products/SearchBar'
import { EmptyView, ErrorView, LoadingView } from '../components/products/StateViews'
import { GradientButton } from '../components/ui/GradientButton'
import { errorMessage } from '../hooks/useAsync'
import { useProducts } from '../hooks/useProducts'
import { useSellers } from '../hooks/useSellers'
import { deleteProduct } from '../services/productService'
import type { Product } from '../types'

const PAGE_SIZE = 10

export default function ProductsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [sellerId, setSellerId] = useState('')
  const sellers = useSellers()
  const { data, loading, error, reload } = useProducts({
    page,
    page_size: PAGE_SIZE,
    search,
    seller_id: sellerId ? Number(sellerId) : undefined,
  })
  const [toDelete, setToDelete] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const handleSearch = useCallback((value: string): void => {
    setSearch(value)
    setPage(1)
  }, [])

  const confirmDelete = async (): Promise<void> => {
    if (!toDelete) return
    setDeleting(true)
    try {
      await deleteProduct(toDelete.id)
      setDeleteError(null)
      setToDelete(null)
      reload()
    } catch (e: unknown) {
      setDeleteError(errorMessage(e, 'Failed to delete product'))
      setToDelete(null)
    } finally {
      setDeleting(false)
    }
  }

  const items = data?.items ?? []
  const filtered = search !== '' || sellerId !== ''

  return (
    <PageWrapper>
      <HStack justify="space-between" mb={6} wrap="wrap">
        <Heading size="xl">Products</Heading>
        <GradientButton asChild>
          <Link to="/products/new">New product</Link>
        </GradientButton>
      </HStack>
      <HStack mb={4} gap={3} wrap="wrap">
        <SearchBar value={search} onChange={handleSearch} />
        <NativeSelect.Root maxW="240px">
          <NativeSelect.Field
            aria-label="Filter by seller"
            value={sellerId}
            onChange={(e) => {
              setSellerId(e.target.value)
              setPage(1)
            }}
          >
            <option value="">All sellers</option>
            {(sellers.data?.items ?? []).map((s) => (
              <option key={s.id} value={String(s.id)}>
                {s.name}
              </option>
            ))}
          </NativeSelect.Field>
          <NativeSelect.Indicator />
        </NativeSelect.Root>
      </HStack>
      {deleteError && <ErrorView message={deleteError} />}
      {loading && <LoadingView />}
      {!loading && error && <ErrorView message={error} onRetry={reload} />}
      {!loading && !error && items.length === 0 && (
        <EmptyView
          title={filtered ? 'No matching products' : 'No products yet'}
          description={filtered ? 'Try a different search or seller filter.' : 'Add your first product to start generating listings.'}
          action={
            !filtered ? (
              <Button asChild colorPalette="purple">
                <Link to="/products/new">Add product</Link>
              </Button>
            ) : undefined
          }
        />
      )}
      {!loading && !error && items.length > 0 && (
        <>
          <ProductTable products={items} onDelete={setToDelete} />
          <Pager page={page} pageSize={PAGE_SIZE} total={data?.total ?? items.length} onPage={setPage} />
        </>
      )}
      <ConfirmDialog
        open={toDelete !== null}
        title="Delete product"
        message={`Delete "${toDelete?.name ?? ''}" and its listings? This cannot be undone.`}
        loading={deleting}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setToDelete(null)}
      />
    </PageWrapper>
  )
}
