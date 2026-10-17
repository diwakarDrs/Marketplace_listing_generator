import { Box } from '@chakra-ui/react'

export function MeshBackground() {
  return (
    <Box position="fixed" inset={0} zIndex={-1} overflow="hidden" aria-hidden="true">
      <Box position="absolute" inset={0} bgGradient="to-br" gradientFrom="purple.50" gradientVia="white" gradientTo="pink.50" />
      <Box
        position="absolute"
        inset={0}
        opacity={0.5}
        bgImage="radial-gradient(circle, rgba(168, 85, 247, 0.18) 1px, transparent 1px)"
        bgSize="28px 28px"
      />
      <Box position="absolute" top="-6rem" left="15%" w="28rem" h="28rem" bg="purple.300" rounded="full" filter="blur(80px)" opacity={0.35} animation="floatA 18s ease-in-out infinite" />
      <Box position="absolute" bottom="-6rem" right="12%" w="30rem" h="30rem" bg="pink.300" rounded="full" filter="blur(90px)" opacity={0.3} animation="floatB 22s ease-in-out infinite" />
      <Box position="absolute" top="40%" right="35%" w="20rem" h="20rem" bg="orange.200" rounded="full" filter="blur(90px)" opacity={0.25} animation="floatA 26s ease-in-out infinite reverse" />
    </Box>
  )
}
