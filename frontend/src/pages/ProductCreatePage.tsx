import { Heading } from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'
import { PageWrapper } from '../components/layout/PageWrapper'
import { ProductForm } from '../components/products/ProductForm'
import { GlassCard } from '../components/ui/GlassCard'
import { createProduct } from '../services/productService'
import type { ProductInput } from '../types'

export default function ProductCreatePage() {
  const navigate = useNavigate()

  const handleSubmit = async (input: ProductInput): Promise<void> => {
    const product = await createProduct(input)
    navigate(`/products/${product.id}`)
  }

  return (
    <PageWrapper>
      <Heading size="xl" mb={6}>
        New product
      </Heading>
      <GlassCard maxW="3xl">
        <ProductForm submitLabel="Create product" onSubmit={handleSubmit} />
      </GlassCard>
    </PageWrapper>
  )
}
