import { Box, Button, Field, Flex, Heading, NativeSelect, Text } from '@chakra-ui/react'
import { useState, type ChangeEvent } from 'react'
import { PageWrapper } from '../components/layout/PageWrapper'
import { GlassCard, GradientButton } from '../components/ui'
import type { MarketplaceId } from '../types'

const PREFS_KEY = 'app_preferences'

interface Preferences {
  marketplace: MarketplaceId
  language: string
}

const DEFAULT_PREFS: Preferences = { marketplace: 'amazon', language: 'en' }

const MARKETPLACES: { id: MarketplaceId; name: string }[] = [
  { id: 'amazon', name: 'Amazon' },
  { id: 'flipkart', name: 'Flipkart' },
  { id: 'meesho', name: 'Meesho' },
  { id: 'shopify', name: 'Shopify' },
]

const LANGUAGES: { code: string; name: string }[] = [
  { code: 'en', name: 'English' },
]

function loadPrefs(): Preferences {
  try {
    const raw = localStorage.getItem(PREFS_KEY)
    if (!raw) return DEFAULT_PREFS
    const parsed = JSON.parse(raw) as Partial<Preferences>
    const marketplace = MARKETPLACES.find((m) => m.id === parsed.marketplace)?.id ?? DEFAULT_PREFS.marketplace
    const language = LANGUAGES.find((l) => l.code === parsed.language)?.code ?? DEFAULT_PREFS.language
    return { marketplace, language }
  } catch {
    return DEFAULT_PREFS
  }
}

function savePrefs(prefs: Preferences): boolean {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
    return true
  } catch {
    return false
  }
}

export default function SettingsPage() {
  const [prefs, setPrefs] = useState<Preferences>(loadPrefs)
  const [status, setStatus] = useState<'idle' | 'saved' | 'failed'>('idle')

  const onMarketplace = (e: ChangeEvent<HTMLSelectElement>) => {
    const next = MARKETPLACES.find((m) => m.id === e.target.value)
    if (next) setPrefs((p) => ({ ...p, marketplace: next.id }))
    setStatus('idle')
  }
  const onLanguage = (e: ChangeEvent<HTMLSelectElement>) => {
    setPrefs((p) => ({ ...p, language: e.target.value }))
    setStatus('idle')
  }
  const onSave = () => setStatus(savePrefs(prefs) ? 'saved' : 'failed')

  return (
    <PageWrapper>
      <Flex direction="column" gap="6" maxW="2xl">
        <Heading size="2xl">Settings</Heading>

        <GlassCard>
          <Heading size="md" mb="4">
            Preferences
          </Heading>
          <Flex direction="column" gap="4">
            <Field.Root>
              <Field.Label>Default marketplace</Field.Label>
              <NativeSelect.Root>
                <NativeSelect.Field value={prefs.marketplace} onChange={onMarketplace}>
                  {MARKETPLACES.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </NativeSelect.Field>
                <NativeSelect.Indicator />
              </NativeSelect.Root>
            </Field.Root>
            <Field.Root>
              <Field.Label>Default language</Field.Label>
              <NativeSelect.Root>
                <NativeSelect.Field value={prefs.language} onChange={onLanguage}>
                  {LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.name}
                    </option>
                  ))}
                </NativeSelect.Field>
                <NativeSelect.Indicator />
              </NativeSelect.Root>
            </Field.Root>
            <Flex align="center" gap="3">
              <GradientButton onClick={onSave}>Save preferences</GradientButton>
              {status === 'saved' ? (
                <Text color="green.fg" fontSize="sm" role="status">
                  Saved
                </Text>
              ) : null}
              {status === 'failed' ? (
                <Text color="red.fg" fontSize="sm" role="alert">
                  Could not save on this browser
                </Text>
              ) : null}
            </Flex>
          </Flex>
        </GlassCard>

        <Box p="6" rounded="2xl" borderWidth="1px" borderColor="red.muted" bg="red.subtle">
          <Heading size="md" color="red.fg" mb="1">
            Danger zone
          </Heading>
          <Text fontSize="sm" color="fg" mb="4">
            These actions are not available yet.
          </Text>
          <Flex gap="3" wrap="wrap">
            <Button variant="outline" colorPalette="red" disabled>
              Log out everywhere (coming soon)
            </Button>
            <Button colorPalette="red" disabled>
              Delete account (coming soon)
            </Button>
          </Flex>
        </Box>
      </Flex>
    </PageWrapper>
  )
}
