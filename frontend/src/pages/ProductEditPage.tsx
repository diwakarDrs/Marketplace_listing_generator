import { Heading } from '@chakra-ui/react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageWrapper } from '../components/layout/PageWrapper'
import { ProductForm } from '../components/products/ProductForm'
import { ErrorView, LoadingView } from '../components/products/StateViews'
import { GlassCard } from '../components/ui/GlassCard'
import { useAsync } from '../hooks/useAsync'
import { getProduct, updateProduct } from '../services/productService'
import type { ProductInput } from '../types'

export default function ProductEditPage() {
  const { id } = useParams<{ id: string }>()
  const productId = Number(id)
  const navigate = useNavigate()
  const { data, loading, error, reload } = useAsync(() => getProduct(productId), [productId])

  const handleSubmit = async (input: ProductInput): Promise<void> => {
    await updateProduct(productId, input)
    navigate(`/products/${productId}`)
  }

  return (
    <PageWrapper>
      <Heading size="xl" mb={6}>
        Edit product
      </Heading>
      {loading && <LoadingView />}
      {!loading && error && <ErrorView message={error} onRetry={reload} />}
      {!loading && data && (
        <GlassCard maxW="3xl">
          <ProductForm initial={data} submitLabel="Save changes" onSubmit={handleSubmit} />
        </GlassCard>
      )}
    </PageWrapper>
  )
}
