import { useEffect, useState } from 'react'
import { Center, Heading, Link, Separator, Spinner, Stack, Text } from '@chakra-ui/react'
import { Link as RouterLink, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { MeshBackground } from '../components/layout'
import { ColorModeToggle, GlassCard } from '../components/ui'
import { LoginForm } from '../components/auth/LoginForm'
import { GoogleLoginButton } from '../components/auth/GoogleLoginButton'
import { useAuth } from '../hooks/useAuth'
import { clearOAuthParams, readOAuthCallback } from '../services/authService'

export default function LoginPage() {
  const { user, isLoading, setTokens } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [callback] = useState(() => readOAuthCallback(location.search, location.hash))
  const [processing, setProcessing] = useState<boolean>(callback.tokens !== null)
  const [oauthError, setOauthError] = useState<string | null>(callback.error)

  // Scrub tokens/error from the address bar and history as soon as they have been read.
  useEffect(() => {
    if (callback.tokens || callback.error) clearOAuthParams()
  }, [callback])

  useEffect(() => {
    if (!callback.tokens) return
    let active = true
    setTokens(callback.tokens)
      .then(() => {
        if (active) navigate('/dashboard', { replace: true })
      })
      .catch(() => {
        if (active) {
          setOauthError('Google sign-in failed. Please try again.')
          setProcessing(false)
        }
      })
    return () => {
      active = false
    }
  }, [callback, setTokens, navigate])

  if (processing || isLoading) {
    return (
      <Center h="100vh" flexDirection="column" gap={3} role="status">
        <Spinner size="xl" color="purple.500" />
        <Text>Signing you in...</Text>
      </Center>
    )
  }
  if (user) return <Navigate to="/dashboard" replace />

  return (
    <Center minH="100vh" px={4}>
      <MeshBackground />
      <ColorModeToggle position="fixed" top={4} right={4} />
      <GlassCard w="full" maxW="md">
        <Stack gap={5}>
          <Stack gap={1}>
            <Heading as="h1" size="2xl">Welcome back</Heading>
            <Text color="fg.muted">Sign in to your account</Text>
          </Stack>
          <LoginForm initialError={oauthError} />
          <Stack direction="row" align="center" gap={3}>
            <Separator flex="1" />
            <Text fontSize="sm" color="fg.subtle">or</Text>
            <Separator flex="1" />
          </Stack>
          <GoogleLoginButton />
          <Text fontSize="sm" textAlign="center">
            No account yet?{' '}
            <Link asChild color="accent">
              <RouterLink to="/register">Create one</RouterLink>
            </Link>
          </Text>
        </Stack>
      </GlassCard>
    </Center>
  )
}
