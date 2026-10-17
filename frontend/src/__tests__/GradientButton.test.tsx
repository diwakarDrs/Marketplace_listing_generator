import { render, screen } from '@testing-library/react'
import { ChakraProvider } from '@chakra-ui/react'
import { describe, expect, it } from 'vitest'
import { GradientButton } from '../components/ui/GradientButton'
import { system } from '../theme'

describe('GradientButton', () => {
  it('renders its children', () => {
    render(
      <ChakraProvider value={system}>
        <GradientButton>Generate</GradientButton>
      </ChakraProvider>,
    )
    expect(screen.getByRole('button', { name: 'Generate' })).toBeInTheDocument()
  })
})
