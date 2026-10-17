import { Field, NativeSelect } from '@chakra-ui/react'
import type { Language } from '../../types'

interface LanguageSelectProps {
  languages: Language[]
  value: string
  onChange: (value: string) => void
  label?: string
  allowAll?: boolean
}

export function LanguageSelect({ languages, value, onChange, label = 'Language', allowAll }: LanguageSelectProps) {
  return (
    <Field.Root>
      <Field.Label>{label}</Field.Label>
      <NativeSelect.Root>
        <NativeSelect.Field value={value} onChange={(e) => onChange(e.currentTarget.value)}>
          {allowAll ? <option value="">All languages</option> : <option value="">Select language</option>}
          {languages.map((l) => (
            <option key={l.code} value={l.code}>
              {l.name}
            </option>
          ))}
        </NativeSelect.Field>
        <NativeSelect.Indicator />
      </NativeSelect.Root>
    </Field.Root>
  )
}
