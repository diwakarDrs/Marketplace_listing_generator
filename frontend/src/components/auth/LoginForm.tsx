import { useState, type FormEvent } from 'react'
import { Alert, Field, Input, Stack } from '@chakra-ui/react'
import { useLocation, useNavigate } from 'react-router-dom'
import { GradientButton } from '../ui'
import { useAuth } from '../../hooks/useAuth'
import { getErrorMessage, isValidEmail } from '../../services/authService'

interface LoginFormProps {
  initialError?: string | null
}

interface RedirectState {
  from?: string
}

export function LoginForm({ initialError = null }: LoginFormProps) {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [error, setError] = useState<string | null>(initialError)
  const [submitting, setSubmitting] = useState<boolean>(false)

  const emailInvalid = email.length > 0 && !isValidEmail(email)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()
    if (!isValidEmail(email) || password.length === 0) {
      setError('Enter a valid email and your password.')
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      await login(email.trim(), password)
      const from = (location.state as RedirectState | null)?.from
      navigate(from ?? '/dashboard', { replace: true })
    } catch (err) {
      setError(getErrorMessage(err, 'Login failed. Check your credentials.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate aria-label="Sign in">
      <Stack gap={4}>
        {error && (
          <Alert.Root status="error" role="alert">
            <Alert.Indicator />
            <Alert.Title>{error}</Alert.Title>
          </Alert.Root>
        )}
        <Field.Root required invalid={emailInvalid}>
          <Field.Label>
            Email <Field.RequiredIndicator />
          </Field.Label>
          <Input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Field.ErrorText>Enter a valid email address.</Field.ErrorText>
        </Field.Root>
        <Field.Root required>
          <Field.Label>
            Password <Field.RequiredIndicator />
          </Field.Label>
          <Input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field.Root>
        <GradientButton type="submit" loading={submitting} loadingText="Signing in" w="full">
          Sign in
        </GradientButton>
      </Stack>
    </form>
  )
}
