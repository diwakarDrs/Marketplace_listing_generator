import { Button, SimpleGrid } from '@chakra-ui/react'
import type { Language, Marketplace, MarketplaceId } from '../../types'
import { LanguageSelect } from './LanguageSelect'
import { MarketplaceSelect } from './MarketplaceSelect'
import { ProductPicker } from './ProductPicker'

export interface ListingFilterValues {
  productId: number | null
  marketplace: MarketplaceId | ''
  language: string
}

interface FiltersProps {
  values: ListingFilterValues
  onChange: (values: ListingFilterValues) => void
  marketplaces: Marketplace[]
  languages: Language[]
}

export function Filters({ values, onChange, marketplaces, languages }: FiltersProps) {
  const hasFilters = values.productId !== null || values.marketplace !== '' || values.language !== ''
  return (
    <SimpleGrid columns={{ base: 1, md: 4 }} gap={4} alignItems="end">
      <ProductPicker allowAll value={values.productId} onChange={(productId) => onChange({ ...values, productId })} />
      <MarketplaceSelect allowAll marketplaces={marketplaces} value={values.marketplace} onChange={(marketplace) => onChange({ ...values, marketplace })} />
      <LanguageSelect allowAll languages={languages} value={values.language} onChange={(language) => onChange({ ...values, language })} />
      <Button variant="outline" disabled={!hasFilters} onClick={() => onChange({ productId: null, marketplace: '', language: '' })}>
        Clear filters
      </Button>
    </SimpleGrid>
  )
}
