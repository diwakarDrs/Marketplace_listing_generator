import { Heading } from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'
import { PageWrapper } from '../components/layout/PageWrapper'
import { SellerForm } from '../components/sellers/SellerForm'
import { GlassCard } from '../components/ui/GlassCard'
import { createSeller } from '../services/sellerService'
import type { SellerProfileInput } from '../types'

export default function SellerCreatePage() {
  const navigate = useNavigate()

  const handleSubmit = async (input: SellerProfileInput): Promise<void> => {
    await createSeller(input)
    navigate('/sellers')
  }

  return (
    <PageWrapper>
      <Heading size="xl" mb={6}>
        New seller
      </Heading>
      <GlassCard maxW="2xl">
        <SellerForm submitLabel="Create seller" onSubmit={handleSubmit} />
      </GlassCard>
    </PageWrapper>
  )
}
