import { useState } from 'react'
import { Alert, Box, Button, Heading, HStack, SimpleGrid, Spinner, Stack, Text } from '@chakra-ui/react'
import { Link as RouterLink, useSearchParams } from 'react-router-dom'
import { GradientButton } from '../components/ui'
import { Panel } from '../components/listings/Panel'
import { PageWrapper } from '../components/layout/PageWrapper'
import { LanguageSelect } from '../components/listings/LanguageSelect'
import { ListingPreview } from '../components/listings/ListingPreview'
import { MarketplaceSelect } from '../components/listings/MarketplaceSelect'
import { ProductPicker } from '../components/listings/ProductPicker'
import { toaster } from '../components/listings/toaster'
import { useMarketplaces } from '../hooks/useListings'
import { generateListing, parseListingError, type ListingError } from '../services/listingService'
import type { Listing, MarketplaceId } from '../types'

export default function GeneratePage() {
  const [searchParams] = useSearchParams()
  const initialProduct = Number(searchParams.get('productId'))
  const [productId, setProductId] = useState<number | null>(Number.isInteger(initialProduct) && initialProduct > 0 ? initialProduct : null)
  const [marketplace, setMarketplace] = useState<MarketplaceId | ''>('')
  const [chosenLanguage, setLanguage] = useState<string>('')
  const [generating, setGenerating] = useState<boolean>(false)
  const [error, setError] = useState<ListingError | null>(null)
  const [result, setResult] = useState<Listing | null>(null)

  const meta = useMarketplaces()

  const marketplaces = meta.data?.marketplaces ?? []
  const languages = meta.data?.languages ?? []
  const selectedRules = marketplaces.find((m) => m.id === marketplace)?.rules

  const defaultLanguage = languages.find((l) => l.code === 'en')?.code ?? languages[0]?.code ?? ''
  const language = chosenLanguage || defaultLanguage

  const canGenerate = productId !== null && marketplace !== '' && language !== '' && !generating

  const handleGenerate = async (): Promise<void> => {
    if (productId === null || marketplace === '') return
    setGenerating(true)
    setError(null)
    setResult(null)
    try {
      const listing = await generateListing({ product_id: productId, marketplace, language })
      setResult(listing)
      toaster.create({ title: 'Listing generated', type: 'success' })
    } catch (e: unknown) {
      const parsed = parseListingError(e)
      setError(parsed)
      toaster.create({ title: parsed.kind === 'quota' ? 'Quota exceeded' : parsed.kind === 'rate_limit' ? 'Too many requests' : 'Generation failed', description: parsed.message, type: 'error' })
    } finally {
      setGenerating(false)
    }
  }

  return (
    <PageWrapper>
      <Stack gap={6}>
        <Heading size="2xl">Generate Listing</Heading>

        {meta.error && (
          <Alert.Root status="error">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>Could not load form data</Alert.Title>
              <Alert.Description>{meta.error?.message}</Alert.Description>
            </Alert.Content>
          </Alert.Root>
        )}

        <Panel>
          <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
            <ProductPicker value={productId} onChange={setProductId} />
            <MarketplaceSelect marketplaces={marketplaces} value={marketplace} onChange={setMarketplace} />
            <LanguageSelect languages={languages} value={language} onChange={setLanguage} />
          </SimpleGrid>
          {selectedRules && (
            <Text mt={3} fontSize="sm" color="gray.600">
              Limits: title {selectedRules.title_max_length} chars, {selectedRules.bullet_count} bullets of up to{' '}
              {selectedRules.bullet_max_length} chars, description up to {selectedRules.description_max_length} chars.
            </Text>
          )}
          <HStack mt={5}>
            <GradientButton onClick={handleGenerate} disabled={!canGenerate} loading={generating} loadingText="Generating...">
              Generate listing
            </GradientButton>
          </HStack>
        </Panel>

        {generating && (
          <Panel>
            <HStack gap={4}>
              <Spinner color="purple.500" size="lg" />
              <Box>
                <Text fontWeight="semibold">Writing your listing...</Text>
                <Text fontSize="sm" color="gray.600">
                  This can take up to 30 seconds. Please keep this page open.
                </Text>
              </Box>
            </HStack>
          </Panel>
        )}

        {error && (
          <Alert.Root status={error.kind === 'quota' ? 'warning' : 'error'}>
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>
                {error.kind === 'quota' ? 'Monthly quota exceeded' : error.kind === 'ai' ? 'AI service problem' : 'Could not generate listing'}
              </Alert.Title>
              <Alert.Description>{error.message}</Alert.Description>
            </Alert.Content>
            {error.kind !== 'quota' && (
              <Button size="sm" variant="outline" onClick={handleGenerate} disabled={!canGenerate}>
                Try again
              </Button>
            )}
          </Alert.Root>
        )}

        {result && (
          <Panel>
            <ListingPreview listing={result} rules={selectedRules} />
            <HStack mt={6} gap={3}>
              <Button asChild colorPalette="purple">
                <RouterLink to={`/listings/${result.id}`}>Open and edit</RouterLink>
              </Button>
              <Button asChild variant="outline">
                <RouterLink to="/listings">All listings</RouterLink>
              </Button>
            </HStack>
          </Panel>
        )}
      </Stack>
    </PageWrapper>
  )
}
