import { useEffect, useState } from 'react'
import { Alert, Button, Heading, Spinner, Stack } from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'
import { GlassCard } from '../components/ui'
import { ProfileForm } from '../components/auth/ProfileForm'
import { useAuth } from '../hooks/useAuth'
import { fetchCurrentUser, getErrorMessage } from '../services/authService'
import type { User } from '../types'

export default function ProfilePage() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<User | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    fetchCurrentUser()
      .then((u) => {
        if (active) setProfile(u)
      })
      .catch((err: unknown) => {
        if (active) setError(getErrorMessage(err, 'Could not load your profile.'))
      })
    return () => {
      active = false
    }
  }, [])

  const handleLogout = (): void => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <Stack gap={6} maxW="2xl">
      <Heading as="h1" size="2xl">Profile</Heading>
      <GlassCard>
        {error && (
          <Alert.Root status="error" role="alert">
            <Alert.Indicator />
            <Alert.Title>{error}</Alert.Title>
          </Alert.Root>
        )}
        {!error && !profile && <Spinner color="purple.500" aria-label="Loading profile" />}
        {profile && (
          <Stack gap={6}>
            <ProfileForm user={profile} />
            <Button variant="outline" colorPalette="red" alignSelf="flex-start" onClick={handleLogout}>
              Log out
            </Button>
          </Stack>
        )}
      </GlassCard>
    </Stack>
  )
}
