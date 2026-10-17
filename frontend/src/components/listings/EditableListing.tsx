import { useState } from 'react'
import { Button, Field, HStack, Input, Stack, Text, Textarea } from '@chakra-ui/react'
import type { Listing, ListingUpdateInput, MarketplaceRules } from '../../types'
import { CharCounter } from './CharCounter'
import { buildListingText } from './clipboard'
import { CopyButton } from './CopyButton'

interface EditableListingProps {
  listing: Listing
  rules: MarketplaceRules | null
  saving: boolean
  onSave: (payload: ListingUpdateInput) => void
}

interface FieldHeaderProps {
  label: string
  value: string
  max?: number
}

function FieldHeader({ label, value, max }: FieldHeaderProps) {
  return (
    <HStack justify="space-between" w="full">
      <Field.Label mb={0}>{label}</Field.Label>
      <HStack gap={2}>
        {max !== undefined && <CharCounter value={value} max={max} />}
        <CopyButton text={value} />
      </HStack>
    </HStack>
  )
}

function splitKeywords(raw: string): string[] {
  return raw
    .split(/[,\n]/)
    .map((k) => k.trim())
    .filter((k) => k.length > 0)
}

export function EditableListing({ listing, rules, saving, onSave }: EditableListingProps) {
  const [title, setTitle] = useState<string>(listing.title)
  const [bullets, setBullets] = useState<string[]>(listing.bullets)
  const [description, setDescription] = useState<string>(listing.description)
  const [keywords, setKeywords] = useState<string>(listing.keywords.join(', '))

  const keywordList = splitKeywords(keywords)
  const dirty =
    title !== listing.title ||
    description !== listing.description ||
    keywords !== listing.keywords.join(', ') ||
    bullets.length !== listing.bullets.length ||
    bullets.some((b, i) => b !== listing.bullets[i])

  const updateBullet = (index: number, value: string): void => {
    setBullets((prev) => prev.map((b, i) => (i === index ? value : b)))
  }

  const handleSave = (): void => {
    onSave({ title, bullets: bullets.filter((b) => b.trim().length > 0), description, keywords: keywordList })
  }

  const reset = (): void => {
    setTitle(listing.title)
    setBullets(listing.bullets)
    setDescription(listing.description)
    setKeywords(listing.keywords.join(', '))
  }

  return (
    <Stack gap={5}>
      <Field.Root>
        <FieldHeader label="Title" value={title} max={rules?.title_max_length} />
        <Input value={title} onChange={(e) => setTitle(e.currentTarget.value)} />
      </Field.Root>

      <Stack gap={3}>
        <HStack justify="space-between">
          <Text fontWeight="medium" fontSize="sm">
            Bullet points
          </Text>
          <CopyButton text={bullets.join('\n')} />
        </HStack>
        {bullets.map((b, i) => (
          <Field.Root key={i}>
            <FieldHeader label={`Bullet ${i + 1}`} value={b} max={rules?.bullet_max_length} />
            <Textarea value={b} rows={2} autoresize onChange={(e) => updateBullet(i, e.currentTarget.value)} />
          </Field.Root>
        ))}
      </Stack>

      <Field.Root>
        <FieldHeader label="Description" value={description} max={rules?.description_max_length} />
        <Textarea
          value={description}
          rows={8}
          autoresize
          onChange={(e) => setDescription(e.currentTarget.value)}
        />
      </Field.Root>

      <Field.Root>
        <FieldHeader label="Keywords (comma separated)" value={keywordList.join(', ')} />
        <Textarea value={keywords} rows={2} autoresize onChange={(e) => setKeywords(e.currentTarget.value)} />
        {rules && keywordList.some((k) => Array.from(k).length > rules.keyword_max_length) && (
          <Field.HelperText color="orange.600">
            Some keywords exceed {rules.keyword_max_length} characters.
          </Field.HelperText>
        )}
      </Field.Root>

      <HStack wrap="wrap" gap={3}>
        <Button colorPalette="purple" onClick={handleSave} loading={saving} disabled={!dirty}>
          Save changes
        </Button>
        <Button variant="outline" onClick={reset} disabled={!dirty || saving}>
          Discard
        </Button>
        <CopyButton
          size="md"
          label="Copy all"
          text={buildListingText({ title, bullets, description, keywords: keywordList })}
        />
      </HStack>
    </Stack>
  )
}
