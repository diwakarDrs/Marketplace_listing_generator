import { Center, Heading, Link, Separator, Spinner, Stack, Text } from '@chakra-ui/react'
import { Link as RouterLink, Navigate } from 'react-router-dom'
import { MeshBackground } from '../components/layout'
import { GlassCard } from '../components/ui'
import { RegisterForm } from '../components/auth/RegisterForm'
import { GoogleLoginButton } from '../components/auth/GoogleLoginButton'
import { useAuth } from '../hooks/useAuth'

export default function RegisterPage() {
  const { user, isLoading } = useAuth()
  if (isLoading) {
    return (
      <Center h="100vh" role="status">
        <Spinner size="xl" color="purple.500" />
      </Center>
    )
  }
  if (user) return <Navigate to="/dashboard" replace />

  return (
    <Center minH="100vh" px={4} py={8}>
      <MeshBackground />
      <GlassCard w="full" maxW="md">
        <Stack gap={5}>
          <Stack gap={1}>
            <Heading as="h1" size="2xl">Create your account</Heading>
            <Text color="gray.600">Start generating marketplace listings</Text>
          </Stack>
          <RegisterForm />
          <Stack direction="row" align="center" gap={3}>
            <Separator flex="1" />
            <Text fontSize="sm" color="gray.500">or</Text>
            <Separator flex="1" />
          </Stack>
          <GoogleLoginButton label="Sign up with Google" />
          <Text fontSize="sm" textAlign="center">
            Already have an account?{' '}
            <Link asChild color="purple.600">
              <RouterLink to="/login">Sign in</RouterLink>
            </Link>
          </Text>
        </Stack>
      </GlassCard>
    </Center>
  )
}
