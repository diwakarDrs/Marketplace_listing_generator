import { Field, Input, NativeSelect, Text } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { getProduct, listProducts } from '../../services/productService'
import type { Product } from '../../types'

export const PICKER_PAGE_SIZE = 50
export const PICKER_SEARCH_MAX = 100
const DEBOUNCE_MS = 300

interface ProductPickerProps {
  value: number | null
  onChange: (value: number | null) => void
  label?: string
  allowAll?: boolean
}

/** Search-as-you-type product picker: queries the API (debounced) instead of preloading a fixed page. */
export function ProductPicker({ value, onChange, label = 'Product', allowAll }: ProductPickerProps) {
  const [query, setQuery] = useState('')
  const [term, setTerm] = useState('')
  const [results, setResults] = useState<Product[]>([])
  const [selected, setSelected] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const t = window.setTimeout(() => setTerm(query.trim()), DEBOUNCE_MS)
    return () => window.clearTimeout(t)
  }, [query])

  useEffect(() => {
    let active = true
    listProducts({ search: term || undefined, page: 1, page_size: PICKER_PAGE_SIZE })
      .then((res) => {
        if (!active) return
        setResults(res.items)
        setFailed(false)
      })
      .catch(() => {
        if (active) setFailed(true)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [term])

  // Resolve the current selection's name when it is not part of the search results (e.g. ?productId=).
  useEffect(() => {
    if (value === null) return
    if (results.some((p) => p.id === value) || selected?.id === value) return
    let active = true
    getProduct(value)
      .then((p) => {
        if (active) setSelected(p)
      })
      .catch(() => undefined)
    return () => {
      active = false
    }
  }, [value, results, selected])

  const options =
    value !== null && selected?.id === value && !results.some((p) => p.id === value) ? [selected, ...results] : results
  const emptyLabel = allowAll ? 'All products' : 'Select a product'

  return (
    <Field.Root>
      <Field.Label>{label}</Field.Label>
      <Input
        size="sm"
        value={query}
        maxLength={PICKER_SEARCH_MAX}
        onChange={(e) => {
          setLoading(true)
          setQuery(e.target.value)
        }}
        placeholder="Search products..."
        aria-label={`Search ${label.toLowerCase()}`}
      />
      <NativeSelect.Root>
        <NativeSelect.Field
          aria-label={label}
          value={value === null ? '' : String(value)}
          onChange={(e) => {
            const v = e.currentTarget.value
            onChange(v === '' ? null : Number(v))
          }}
        >
          <option value="">{loading ? 'Loading products...' : emptyLabel}</option>
          {options.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </NativeSelect.Field>
        <NativeSelect.Indicator />
      </NativeSelect.Root>
      {failed && (
        <Text fontSize="sm" color="red.fg">
          Could not load products.
        </Text>
      )}
      {!loading && !failed && results.length === 0 && (
        <Text fontSize="sm" color="fg.subtle">
          {term ? 'No products match your search.' : 'No products yet. Create a product first.'}
        </Text>
      )}
    </Field.Root>
  )
}
