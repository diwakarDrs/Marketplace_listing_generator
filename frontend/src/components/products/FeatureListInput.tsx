import { Button, HStack, IconButton, Input, Stack } from '@chakra-ui/react'
import { useState } from 'react'

interface FeatureListInputProps {
  value: string[]
  onChange: (value: string[]) => void
}

export function FeatureListInput({ value, onChange }: FeatureListInputProps) {
  const [draft, setDraft] = useState('')

  const add = (): void => {
    const text = draft.trim()
    if (!text) return
    onChange([...value, text])
    setDraft('')
  }

  return (
    <Stack gap={2}>
      {value.map((feature, i) => (
        <HStack key={i}>
          <Input
            value={feature}
            aria-label={`Feature ${i + 1}`}
            onChange={(e) => onChange(value.map((f, idx) => (idx === i ? e.target.value : f)))}
          />
          <IconButton
            aria-label={`Remove feature ${i + 1}`}
            variant="ghost"
            colorPalette="red"
            onClick={() => onChange(value.filter((_, idx) => idx !== i))}
          >
            ×
          </IconButton>
        </HStack>
      ))}
      <HStack>
        <Input
          value={draft}
          placeholder="Add a key feature"
          aria-label="New feature"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              add()
            }
          }}
        />
        <Button variant="outline" onClick={add}>
          Add
        </Button>
      </HStack>
    </Stack>
  )
}
