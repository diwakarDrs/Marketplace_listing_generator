import { Spinner, Stack, Toast, Toaster } from '@chakra-ui/react'
import { toaster } from './toaster'

export function ListingToaster() {
  return (
    <Toaster toaster={toaster}>
      {(t) => (
        <Toast.Root width={{ md: 'sm' }}>
          {t.type === 'loading' ? <Spinner size="sm" /> : <Toast.Indicator />}
          <Stack gap="1" flex="1">
            {t.title && <Toast.Title>{t.title}</Toast.Title>}
            {t.description && <Toast.Description>{t.description}</Toast.Description>}
          </Stack>
          <Toast.CloseTrigger />
        </Toast.Root>
      )}
    </Toaster>
  )
}
