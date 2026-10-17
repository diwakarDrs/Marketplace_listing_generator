import { Box, type BoxProps } from '@chakra-ui/react'

export function Panel({ children, ...rest }: BoxProps) {
  return (
    <Box
      p={6}
      rounded="2xl"
      bg="whiteAlpha.700"
      backdropFilter="blur(16px)"
      borderWidth="1px"
      borderColor="whiteAlpha.600"
      shadow="xl"
      {...rest}
    >
      {children}
    </Box>
  )
}
