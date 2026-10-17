import { Field, NativeSelect } from '@chakra-ui/react'
import type { Marketplace, MarketplaceId } from '../../types'

interface MarketplaceSelectProps {
  marketplaces: Marketplace[]
  value: MarketplaceId | ''
  onChange: (value: MarketplaceId | '') => void
  label?: string
  allowAll?: boolean
}

export function MarketplaceSelect({ marketplaces, value, onChange, label = 'Marketplace', allowAll }: MarketplaceSelectProps) {
  return (
    <Field.Root>
      <Field.Label>{label}</Field.Label>
      <NativeSelect.Root>
        <NativeSelect.Field
          value={value}
          onChange={(e) => onChange(e.currentTarget.value as MarketplaceId | '')}
        >
          {allowAll ? <option value="">All marketplaces</option> : <option value="">Select marketplace</option>}
          {marketplaces.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </NativeSelect.Field>
        <NativeSelect.Indicator />
      </NativeSelect.Root>
    </Field.Root>
  )
}
