import { useState, type FormEvent } from 'react'
import { Alert, Field, Input, Stack } from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'
import { GradientButton } from '../ui'
import { useAuth } from '../../hooks/useAuth'
import { MIN_PASSWORD_LENGTH, getErrorMessage, isValidEmail } from '../../services/authService'

export function RegisterForm() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState<string>('')
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [confirm, setConfirm] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState<boolean>(false)

  const emailInvalid = email.length > 0 && !isValidEmail(email)
  const passwordInvalid = password.length > 0 && password.length < MIN_PASSWORD_LENGTH
  const confirmInvalid = confirm.length > 0 && confirm !== password

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()
    if (!isValidEmail(email) || password.length < MIN_PASSWORD_LENGTH || confirm !== password) {
      setError('Please fix the highlighted fields.')
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      await register(email.trim(), password, fullName.trim())
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(getErrorMessage(err, 'Registration failed. Please try again.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate aria-label="Create account">
      <Stack gap={4}>
        {error && (
          <Alert.Root status="error" role="alert">
            <Alert.Indicator />
            <Alert.Title>{error}</Alert.Title>
          </Alert.Root>
        )}
        <Field.Root>
          <Field.Label>Full name</Field.Label>
          <Input autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </Field.Root>
        <Field.Root required invalid={emailInvalid}>
          <Field.Label>
            Email <Field.RequiredIndicator />
          </Field.Label>
          <Input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Field.ErrorText>Enter a valid email address.</Field.ErrorText>
        </Field.Root>
        <Field.Root required invalid={passwordInvalid}>
          <Field.Label>
            Password <Field.RequiredIndicator />
          </Field.Label>
          <Input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <Field.HelperText>At least {MIN_PASSWORD_LENGTH} characters.</Field.HelperText>
          <Field.ErrorText>Password must be at least {MIN_PASSWORD_LENGTH} characters.</Field.ErrorText>
        </Field.Root>
        <Field.Root required invalid={confirmInvalid}>
          <Field.Label>
            Confirm password <Field.RequiredIndicator />
          </Field.Label>
          <Input type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          <Field.ErrorText>Passwords do not match.</Field.ErrorText>
        </Field.Root>
        <GradientButton type="submit" loading={submitting} loadingText="Creating account" w="full">
          Create account
        </GradientButton>
      </Stack>
    </form>
  )
}
