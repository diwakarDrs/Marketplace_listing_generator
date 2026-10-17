import { useState } from 'react'
import { Button, IconButton } from '@chakra-ui/react'
import { copyText } from './clipboard'
import { toaster } from './toaster'

interface CopyButtonProps {
  text: string
  label?: string
  size?: 'xs' | 'sm' | 'md'
}

export function CopyButton({ text, label, size = 'xs' }: CopyButtonProps) {
  const [copied, setCopied] = useState<boolean>(false)

  const handleCopy = async (): Promise<void> => {
    const ok = await copyText(text)
    if (ok) {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
      toaster.create({ title: 'Copied to clipboard', type: 'success', duration: 1500 })
    } else {
      toaster.create({
        title: 'Could not copy',
        description: 'Your browser blocked clipboard access. Select the text and copy it manually.',
        type: 'error',
      })
    }
  }

  if (label) {
    return (
      <Button size={size} variant="outline" onClick={handleCopy} disabled={!text}>
        {copied ? 'Copied' : label}
      </Button>
    )
  }
  return (
    <IconButton
      size={size}
      variant="ghost"
      aria-label="Copy"
      onClick={handleCopy}
      disabled={!text}
    >
      {copied ? '✓' : '⧉'}
    </IconButton>
  )
}
