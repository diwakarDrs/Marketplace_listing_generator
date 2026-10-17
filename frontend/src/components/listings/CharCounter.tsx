import { Text } from '@chakra-ui/react'

interface CharCounterProps {
  value: string
  max: number
}

export function CharCounter({ value, max }: CharCounterProps) {
  const length = Array.from(value).length
  const over = length > max
  const near = !over && length > max * 0.9
  const color = over ? 'red.600' : near ? 'orange.500' : 'gray.500'
  return (
    <Text fontSize="xs" color={color} fontWeight={over ? 'semibold' : 'normal'} aria-live="polite">
      {length} / {max}
    </Text>
  )
}
