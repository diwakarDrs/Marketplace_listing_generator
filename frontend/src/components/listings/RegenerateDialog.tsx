import { useState } from 'react'
import { Button, CloseButton, Dialog, Field, Portal, Text, Textarea } from '@chakra-ui/react'

interface RegenerateDialogProps {
  open: boolean
  loading: boolean
  onClose: () => void
  onConfirm: (instructions: string) => void
}

export function RegenerateDialog({ open, loading, onClose, onConfirm }: RegenerateDialogProps) {
  const [instructions, setInstructions] = useState<string>('')

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(e) => {
        if (!e.open && !loading) onClose()
      }}
      placement="center"
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Regenerate listing</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Text mb={3} color="fg.muted" fontSize="sm">
                This replaces the current content and uses one generation from your quota. Your manual edits will be lost.
              </Text>
              <Field.Root>
                <Field.Label>Instructions (optional)</Field.Label>
                <Textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.currentTarget.value)}
                  placeholder="e.g. Make the tone more premium and mention the 2-year warranty"
                  rows={4}
                  maxLength={1000}
                />
              </Field.Root>
            </Dialog.Body>
            <Dialog.Footer>
              <Button variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button colorPalette="purple" loading={loading} loadingText="Regenerating..." onClick={() => onConfirm(instructions.trim())}>
                Regenerate
              </Button>
            </Dialog.Footer>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" disabled={loading} />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}
