import { Button, Heading, HStack, SimpleGrid } from '@chakra-ui/react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ConfirmDialog } from '../components/products/ConfirmDialog'
import { EmptyView, ErrorView, LoadingView } from '../components/products/StateViews'
import { Pager } from '../components/products/Pager'
import { PageWrapper } from '../components/layout/PageWrapper'
import { SellerCard } from '../components/sellers/SellerCard'
import { GradientButton } from '../components/ui/GradientButton'
import { errorMessage } from '../hooks/useAsync'
import { useSellers } from '../hooks/useSellers'
import { deleteSeller } from '../services/sellerService'
import type { SellerProfile } from '../types'

const PAGE_SIZE = 12

export default function SellersPage() {
  const [page, setPage] = useState(1)
  const { data, loading, error, reload } = useSellers(page, PAGE_SIZE)
  const [toDelete, setToDelete] = useState<SellerProfile | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const confirmDelete = async (): Promise<void> => {
    if (!toDelete) return
    setDeleting(true)
    try {
      await deleteSeller(toDelete.id)
      setToDelete(null)
      setDeleteError(null)
      reload()
    } catch (e: unknown) {
      setDeleteError(errorMessage(e, 'Failed to delete seller'))
      setToDelete(null)
    } finally {
      setDeleting(false)
    }
  }

  const items = data?.items ?? []
  const visible = items.length > PAGE_SIZE ? items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) : items

  return (
    <PageWrapper>
      <HStack justify="space-between" mb={6} wrap="wrap">
        <Heading size="xl">Sellers</Heading>
        <GradientButton asChild>
          <Link to="/sellers/new">New seller</Link>
        </GradientButton>
      </HStack>
      {deleteError && <ErrorView message={deleteError} />}
      {loading && <LoadingView />}
      {!loading && error && <ErrorView message={error} onRetry={reload} />}
      {!loading && !error && items.length === 0 && (
        <EmptyView
          title="No seller profiles yet"
          description="Create a seller profile to keep your brand voice consistent across listings."
          action={
            <Button asChild colorPalette="purple">
              <Link to="/sellers/new">Create seller</Link>
            </Button>
          }
        />
      )}
      {!loading && !error && items.length > 0 && (
        <>
          <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} gap={4}>
            {visible.map((s) => (
              <SellerCard key={s.id} seller={s} onDelete={setToDelete} />
            ))}
          </SimpleGrid>
          <Pager page={page} pageSize={PAGE_SIZE} total={data?.total ?? items.length} onPage={setPage} />
        </>
      )}
      <ConfirmDialog
        open={toDelete !== null}
        title="Delete seller"
        message={`Delete "${toDelete?.name ?? ''}"? This cannot be undone.`}
        loading={deleting}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setToDelete(null)}
      />
    </PageWrapper>
  )
}
