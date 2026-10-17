import { Button, Field, HStack, Input, NativeSelect, Stack, Text, Textarea } from '@chakra-ui/react'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { errorMessage } from '../../hooks/useAsync'
import { useSellers } from '../../hooks/useSellers'
import type { Product, ProductInput } from '../../types'
import { GradientButton } from '../ui/GradientButton'
import { FeatureListInput } from './FeatureListInput'

interface ProductFormProps {
  initial?: Product
  submitLabel: string
  onSubmit: (input: ProductInput) => Promise<void>
}

export function ProductForm({ initial, submitLabel, onSubmit }: ProductFormProps) {
  const navigate = useNavigate()
  const sellers = useSellers()
  const [name, setName] = useState(initial?.name ?? '')
  const [category, setCategory] = useState(initial?.category ?? '')
  const [brand, setBrand] = useState(initial?.brand ?? '')
  const [price, setPrice] = useState(initial?.price !== null && initial?.price !== undefined ? String(initial.price) : '')
  const [audience, setAudience] = useState(initial?.target_audience ?? '')
  const [sellerId, setSellerId] = useState(initial?.seller_profile_id ? String(initial.seller_profile_id) : '')
  const [features, setFeatures] = useState<string[]>(initial?.key_features ?? [])
  const [nameError, setNameError] = useState<string | null>(null)
  const [priceError, setPriceError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault()
    const trimmedName = name.trim()
    const parsedPrice = price.trim() === '' ? null : Number(price)
    const nameProblem = trimmedName ? null : 'Product name is required'
    const priceProblem = parsedPrice !== null && (!Number.isFinite(parsedPrice) || parsedPrice < 0) ? 'Enter a valid, finite, non-negative price' : null
    setNameError(nameProblem)
    setPriceError(priceProblem)
    if (nameProblem || priceProblem) return
    setSubmitError(null)
    setSaving(true)
    try {
      await onSubmit({
        name: trimmedName,
        category: category.trim() || null,
        brand: brand.trim() || null,
        price: parsedPrice,
        target_audience: audience.trim() || null,
        seller_profile_id: sellerId ? Number(sellerId) : null,
        key_features: features.map((f) => f.trim()).filter(Boolean),
        attributes: initial?.attributes ?? {},
      })
    } catch (err: unknown) {
      setSubmitError(errorMessage(err, 'Failed to save product'))
      setSaving(false)
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} noValidate>
      <Stack gap={4}>
        <Field.Root required invalid={!!nameError}>
          <Field.Label>Product name</Field.Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
          <Field.ErrorText>{nameError}</Field.ErrorText>
        </Field.Root>
        <HStack align="flex-start" gap={4} wrap="wrap">
          <Field.Root flex="1" minW="200px">
            <Field.Label>Category</Field.Label>
            <Input value={category} onChange={(e) => setCategory(e.target.value)} />
          </Field.Root>
          <Field.Root flex="1" minW="200px">
            <Field.Label>Brand</Field.Label>
            <Input value={brand} onChange={(e) => setBrand(e.target.value)} />
          </Field.Root>
        </HStack>
        <HStack align="flex-start" gap={4} wrap="wrap">
          <Field.Root flex="1" minW="200px" invalid={!!priceError}>
            <Field.Label>Price</Field.Label>
            <Input value={price} inputMode="decimal" onChange={(e) => setPrice(e.target.value)} />
            <Field.ErrorText>{priceError}</Field.ErrorText>
          </Field.Root>
          <Field.Root flex="1" minW="200px">
            <Field.Label>Seller profile</Field.Label>
            <NativeSelect.Root>
              <NativeSelect.Field value={sellerId} onChange={(e) => setSellerId(e.target.value)}>
                <option value="">None</option>
                {(sellers.data?.items ?? []).map((s) => (
                  <option key={s.id} value={String(s.id)}>
                    {s.name}
                  </option>
                ))}
              </NativeSelect.Field>
              <NativeSelect.Indicator />
            </NativeSelect.Root>
          </Field.Root>
        </HStack>
        <Field.Root>
          <Field.Label>Target audience</Field.Label>
          <Textarea value={audience} onChange={(e) => setAudience(e.target.value)} rows={2} />
        </Field.Root>
        <Field.Root>
          <Field.Label>Key features</Field.Label>
          <FeatureListInput value={features} onChange={setFeatures} />
        </Field.Root>
        {submitError && (
          <Text color="red.600" role="alert">
            {submitError}
          </Text>
        )}
        <HStack justify="flex-end">
          <Button variant="outline" onClick={() => navigate('/products')} disabled={saving}>
            Cancel
          </Button>
          <GradientButton type="submit" loading={saving}>
            {submitLabel}
          </GradientButton>
        </HStack>
      </Stack>
    </form>
  )
}
