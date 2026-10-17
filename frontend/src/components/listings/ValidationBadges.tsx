import { Badge, HStack, Text } from '@chakra-ui/react'
import type { ValidationWarning } from '../../types'

interface ValidationBadgesProps {
  warnings: ValidationWarning[]
}

export function ValidationBadges({ warnings }: ValidationBadgesProps) {
  if (warnings.length === 0) {
    return (
      <Badge colorPalette="green" variant="subtle">
        All checks passed
      </Badge>
    )
  }
  return (
    <HStack wrap="wrap" gap={2}>
      {warnings.map((w, i) => (
        <Badge key={`${w.field}-${i}`} colorPalette="orange" variant="subtle" px={2} py={1} whiteSpace="normal">
          <Text as="span" fontWeight="semibold">
            {w.field}:
          </Text>{' '}
          {w.message}
        </Badge>
      ))}
    </HStack>
  )
}
