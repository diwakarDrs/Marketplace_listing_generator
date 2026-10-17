import { Heading } from '@chakra-ui/react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageWrapper } from '../components/layout/PageWrapper'
import { ErrorView, LoadingView } from '../components/products/StateViews'
import { SellerForm } from '../components/sellers/SellerForm'
import { GlassCard } from '../components/ui/GlassCard'
import { useAsync } from '../hooks/useAsync'
import { getSeller, updateSeller } from '../services/sellerService'
import type { SellerProfileInput } from '../types'

export default function SellerEditPage() {
  const { id } = useParams<{ id: string }>()
  const sellerId = Number(id)
  const navigate = useNavigate()
  const { data, loading, error, reload } = useAsync(() => getSeller(sellerId), [sellerId])

  const handleSubmit = async (input: SellerProfileInput): Promise<void> => {
    await updateSeller(sellerId, input)
    navigate('/sellers')
  }

  return (
    <PageWrapper>
      <Heading size="xl" mb={6}>
        Edit seller
      </Heading>
      {loading && <LoadingView />}
      {!loading && error && <ErrorView message={error} onRetry={reload} />}
      {!loading && data && (
        <GlassCard maxW="2xl">
          <SellerForm initial={data} submitLabel="Save changes" onSubmit={handleSubmit} />
        </GlassCard>
      )}
    </PageWrapper>
  )
}
