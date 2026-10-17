import { Box, type BoxProps } from '@chakra-ui/react'

export function Panel({ children, ...rest }: BoxProps) {
  return (
    <Box
      p={6}
      rounded="2xl"
      bg="glass"
      backdropFilter="blur(16px)"
      borderWidth="1px"
      borderColor="glassBorder"
      shadow="xl"
      {...rest}
    >
      {children}
    </Box>
  )
}
