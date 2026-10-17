import { Button, HStack, Text } from '@chakra-ui/react'

interface PagerProps {
  page: number
  pageSize: number
  total: number
  onPage: (page: number) => void
}

export function Pager({ page, pageSize, total, onPage }: PagerProps) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  if (pages <= 1) return null
  return (
    <HStack justify="center" gap={4} mt={4}>
      <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => onPage(page - 1)}>
        Previous
      </Button>
      <Text fontSize="sm">
        Page {page} of {pages}
      </Text>
      <Button size="sm" variant="outline" disabled={page >= pages} onClick={() => onPage(page + 1)}>
        Next
      </Button>
    </HStack>
  )
}
