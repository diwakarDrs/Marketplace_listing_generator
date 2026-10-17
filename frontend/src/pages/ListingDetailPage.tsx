import { useState } from 'react'
import { Alert, Badge, Button, Center, Dialog, Heading, HStack, Portal, Spinner, Stack, Text } from '@chakra-ui/react'
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom'
import { Panel } from '../components/listings/Panel'
import { PageWrapper } from '../components/layout/PageWrapper'
import { EditableListing } from '../components/listings/EditableListing'
import { RegenerateDialog } from '../components/listings/RegenerateDialog'
import { toaster } from '../components/listings/toaster'
import { ValidationBadges } from '../components/listings/ValidationBadges'
import { useListing, useMarketplaces } from '../hooks/useListings'
import {
  deleteListing,
  downloadExport,
  parseListingError,
  regenerateListing,
  updateListing,
  type ExportFormat,
} from '../services/listingService'
import type { Listing, ListingUpdateInput } from '../types'

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const listingId = Number(id)
  const navigate = useNavigate()
  const state = useListing(listingId)
  const meta = useMarketplaces()
  const [override, setOverride] = useState<Listing | null>(null)
  const [saving, setSaving] = useState<boolean>(false)
  const [regenOpen, setRegenOpen] = useState<boolean>(false)
  const [regenerating, setRegenerating] = useState<boolean>(false)
  const [deleteOpen, setDeleteOpen] = useState<boolean>(false)
  const [deleting, setDeleting] = useState<boolean>(false)

  const listing = override ?? state.data
  const marketplace = meta.data?.marketplaces.find((m) => m.id === listing?.marketplace)

  const fail = (title: string, e: unknown): void => {
    toaster.create({ title, description: parseListingError(e).message, type: 'error' })
  }

  const handleSave = async (payload: ListingUpdateInput): Promise<void> => {
    setSaving(true)
    try {
      setOverride(await updateListing(listingId, payload))
      toaster.create({ title: 'Listing saved', type: 'success' })
    } catch (e: unknown) {
      fail('Could not save', e)
    } finally {
      setSaving(false)
    }
  }

  const handleRegenerate = async (instructions: string): Promise<void> => {
    setRegenerating(true)
    try {
      setOverride(await regenerateListing(listingId, instructions ? { instructions } : {}))
      setRegenOpen(false)
      toaster.create({ title: 'Listing regenerated', type: 'success' })
    } catch (e: unknown) {
      const parsed = parseListingError(e)
      toaster.create({
        title: parsed.kind === 'quota' ? 'Quota exceeded' : 'Regeneration failed',
        description: parsed.message,
        type: 'error',
      })
    } finally {
      setRegenerating(false)
    }
  }

  const handleExport = async (format: ExportFormat): Promise<void> => {
    try {
      await downloadExport(listingId, format)
    } catch (e: unknown) {
      fail('Export failed', e)
    }
  }

  const handleDelete = async (): Promise<void> => {
    setDeleting(true)
    try {
      await deleteListing(listingId)
      toaster.create({ title: 'Listing deleted', type: 'success' })
      navigate('/listings')
    } catch (e: unknown) {
      fail('Could not delete', e)
      setDeleting(false)
    }
  }

  if (state.loading) {
    return (
      <PageWrapper>
        <Center py={20}>
          <Spinner size="xl" color="purple.500" />
        </Center>
      </PageWrapper>
    )
  }

  if (state.error || !listing) {
    return (
      <PageWrapper>
        <Stack gap={4}>
          <Alert.Root status="error">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>Listing not available</Alert.Title>
              <Alert.Description>{state.error?.message ?? 'Listing not found.'}</Alert.Description>
            </Alert.Content>
          </Alert.Root>
          <Button asChild variant="outline" alignSelf="flex-start">
            <RouterLink to="/listings">Back to listings</RouterLink>
          </Button>
        </Stack>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper>
      <Stack gap={6}>
        <HStack justify="space-between" wrap="wrap" gap={3}>
          <Stack gap={1}>
            <Heading size="2xl">Listing #{listing.id}</Heading>
            <HStack>
              <Badge colorPalette="purple">{marketplace?.name ?? listing.marketplace}</Badge>
              <Badge>{meta.data?.languages.find((l) => l.code === listing.language)?.name ?? listing.language}</Badge>
              <Badge colorPalette={listing.status === 'final' ? 'green' : 'gray'}>{listing.status}</Badge>
              {listing.model_used && (
                <Text fontSize="xs" color="fg.subtle">
                  {listing.model_used}
                </Text>
              )}
            </HStack>
          </Stack>
          <HStack wrap="wrap" gap={2}>
            <Button size="sm" variant="outline" onClick={() => handleExport('text')}>
              Export text
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleExport('csv')}>
              Export CSV
            </Button>
            <Button size="sm" colorPalette="purple" onClick={() => setRegenOpen(true)}>
              Regenerate
            </Button>
            <Button size="sm" colorPalette="red" variant="outline" onClick={() => setDeleteOpen(true)}>
              Delete
            </Button>
          </HStack>
        </HStack>

        <Panel>
          <Stack gap={5}>
            <Stack gap={2}>
              <Text fontWeight="semibold">Validation</Text>
              <ValidationBadges warnings={listing.validation_warnings} />
            </Stack>
            <EditableListing
              key={`${listing.id}-${listing.updated_at}`}
              listing={listing}
              rules={marketplace?.rules ?? null}
              saving={saving}
              onSave={handleSave}
            />
          </Stack>
        </Panel>

        <Button asChild variant="ghost" alignSelf="flex-start">
          <RouterLink to="/listings">Back to listings</RouterLink>
        </Button>
      </Stack>

      <RegenerateDialog
        open={regenOpen}
        loading={regenerating}
        onClose={() => setRegenOpen(false)}
        onConfirm={handleRegenerate}
      />

      <Dialog.Root open={deleteOpen} onOpenChange={(e) => !deleting && setDeleteOpen(e.open)} role="alertdialog" placement="center">
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Header>
                <Dialog.Title>Delete listing?</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <Text>This permanently removes the listing. This cannot be undone.</Text>
              </Dialog.Body>
              <Dialog.Footer>
                <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={deleting}>
                  Cancel
                </Button>
                <Button colorPalette="red" loading={deleting} onClick={handleDelete}>
                  Delete
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </PageWrapper>
  )
}
