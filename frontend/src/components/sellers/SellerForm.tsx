import { Button, Field, HStack, Input, NativeSelect, Stack, Text, Textarea } from '@chakra-ui/react'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { errorMessage } from '../../hooks/useAsync'
import type { MarketplaceId, SellerProfile, SellerProfileInput } from '../../types'
import { GradientButton } from '../ui/GradientButton'

const MARKETPLACES: MarketplaceId[] = ['amazon', 'flipkart', 'meesho', 'shopify']

interface SellerFormProps {
  initial?: SellerProfile
  submitLabel: string
  onSubmit: (input: SellerProfileInput) => Promise<void>
}

export function SellerForm({ initial, submitLabel, onSubmit }: SellerFormProps) {
  const navigate = useNavigate()
  const [name, setName] = useState(initial?.name ?? '')
  const [brandName, setBrandName] = useState(initial?.brand_name ?? '')
  const [brandVoice, setBrandVoice] = useState(initial?.brand_voice ?? '')
  const [marketplace, setMarketplace] = useState<string>(initial?.default_marketplace ?? '')
  const [language, setLanguage] = useState(initial?.default_language ?? '')
  const [nameError, setNameError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault()
    if (!name.trim()) {
      setNameError('Name is required')
      return
    }
    setNameError(null)
    setSubmitError(null)
    setSaving(true)
    try {
      await onSubmit({
        name: name.trim(),
        brand_name: brandName.trim() || null,
        brand_voice: brandVoice.trim() || null,
        default_marketplace: (marketplace as MarketplaceId) || null,
        default_language: language.trim() || null,
      })
    } catch (err: unknown) {
      setSubmitError(errorMessage(err, 'Failed to save seller'))
      setSaving(false)
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} noValidate>
      <Stack gap={4}>
        <Field.Root required invalid={!!nameError}>
          <Field.Label>Seller name</Field.Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
          <Field.ErrorText>{nameError}</Field.ErrorText>
        </Field.Root>
        <Field.Root>
          <Field.Label>Brand name</Field.Label>
          <Input value={brandName} onChange={(e) => setBrandName(e.target.value)} />
        </Field.Root>
        <Field.Root>
          <Field.Label>Brand voice</Field.Label>
          <Textarea
            value={brandVoice}
            onChange={(e) => setBrandVoice(e.target.value)}
            placeholder="e.g. Friendly, premium, concise"
            rows={3}
          />
        </Field.Root>
        <Field.Root>
          <Field.Label>Default marketplace</Field.Label>
          <NativeSelect.Root>
            <NativeSelect.Field value={marketplace} onChange={(e) => setMarketplace(e.target.value)}>
              <option value="">None</option>
              {MARKETPLACES.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
        </Field.Root>
        <Field.Root>
          <Field.Label>Default language</Field.Label>
          <Input value={language} onChange={(e) => setLanguage(e.target.value)} placeholder="e.g. en" />
        </Field.Root>
        {submitError && (
          <Text color="red.600" role="alert">
            {submitError}
          </Text>
        )}
        <HStack justify="flex-end">
          <Button variant="outline" onClick={() => navigate('/sellers')} disabled={saving}>
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
