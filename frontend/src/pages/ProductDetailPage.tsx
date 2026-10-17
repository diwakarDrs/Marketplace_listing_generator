import { Button, Heading, HStack } from '@chakra-ui/react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { PageWrapper } from '../components/layout/PageWrapper'
import { ConfirmDialog } from '../components/products/ConfirmDialog'
import { ListingsList } from '../components/products/ListingsList'
import { ProductSummary } from '../components/products/ProductSummary'
import { EmptyView, ErrorView, LoadingView } from '../components/products/StateViews'
import { GradientButton } from '../components/ui/GradientButton'
import { errorMessage, useAsync } from '../hooks/useAsync'
import { deleteProduct, getProduct, listProductListings, PRODUCT_LISTINGS_LIMIT } from '../services/productService'

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const productId = Number(id)
  const navigate = useNavigate()
  const product = useAsync(() => getProduct(productId), [productId])
  const listings = useAsync(() => listProductListings(productId), [productId])
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const handleDelete = async (): Promise<void> => {
    setDeleting(true)
    try {
      await deleteProduct(productId)
      navigate('/products')
    } catch (e: unknown) {
      setDeleteError(errorMessage(e, 'Failed to delete product'))
      setConfirmOpen(false)
      setDeleting(false)
    }
  }

  const listingItems = listings.data?.items ?? []
  const listingTotal = listings.data?.total ?? 0

  if (product.loading) return <LoadingView />
  if (product.error || !product.data) {
    return (
      <PageWrapper>
        <ErrorView message={product.error ?? 'Product not found'} onRetry={product.reload} />
      </PageWrapper>
    )
  }

  const generateLink = (
    <GradientButton asChild>
      <Link to={`/generate?productId=${productId}`}>Generate listing</Link>
    </GradientButton>
  )

  return (
    <PageWrapper>
      <HStack justify="space-between" mb={6} wrap="wrap">
        <Button asChild variant="ghost">
          <Link to="/products">Back to products</Link>
        </Button>
        <HStack>
          <Button asChild variant="outline">
            <Link to={`/products/${productId}/edit`}>Edit</Link>
          </Button>
          <Button variant="outline" colorPalette="red" onClick={() => setConfirmOpen(true)}>
            Delete
          </Button>
          {generateLink}
        </HStack>
      </HStack>
      {deleteError && <ErrorView message={deleteError} />}
      <ProductSummary product={product.data} />
      <Heading size="md" mt={8} mb={4}>
        Listings
      </Heading>
      {listings.loading && <LoadingView />}
      {!listings.loading && listings.error && <ErrorView message={listings.error} onRetry={listings.reload} />}
      {!listings.loading && !listings.error && listingItems.length === 0 && (
        <EmptyView title="No listings yet" description="Generate your first listing for this product." action={generateLink} />
      )}
      {!listings.loading && !listings.error && listingItems.length > 0 && <ListingsList listings={listingItems} />}
      {!listings.loading && !listings.error && listingTotal > listingItems.length && (
        <Button asChild variant="outline" mt={4}>
          <Link to={`/listings?productId=${productId}`}>
            View all {listingTotal} listings (showing {Math.min(listingItems.length, PRODUCT_LISTINGS_LIMIT)})
          </Link>
        </Button>
      )}
      <ConfirmDialog
        open={confirmOpen}
        title="Delete product"
        message={`Delete "${product.data.name}" and its listings? This cannot be undone.`}
        loading={deleting}
        onConfirm={() => void handleDelete()}
        onCancel={() => setConfirmOpen(false)}
      />
    </PageWrapper>
  )
}
