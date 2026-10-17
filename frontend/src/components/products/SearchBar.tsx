import { Input } from '@chakra-ui/react'
import { useEffect, useState } from 'react'

export const SEARCH_MAX_LENGTH = 100

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function SearchBar({ value, onChange, placeholder = 'Search products...' }: SearchBarProps) {
  const [text, setText] = useState(value)

  useEffect(() => {
    const t = window.setTimeout(() => {
      if (text !== value) onChange(text)
    }, 350)
    return () => window.clearTimeout(t)
  }, [text, value, onChange])

  return (
    <Input
      value={text}
      onChange={(e) => setText(e.target.value)}
      placeholder={placeholder}
      aria-label="Search"
      maxLength={SEARCH_MAX_LENGTH}
      bg="whiteAlpha.800"
      rounded="full"
    />
  )
}
