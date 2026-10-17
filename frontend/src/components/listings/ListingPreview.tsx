import type { ReactNode } from 'react'
import { Badge, Box, Heading, HStack, Stack, Text } from '@chakra-ui/react'
import type { Listing, MarketplaceRules } from '../../types'
import { CharCounter } from './CharCounter'
import { buildListingText } from './clipboard'
import { CopyButton } from './CopyButton'
import { ValidationBadges } from './ValidationBadges'

interface ListingPreviewProps {
  listing: Listing
  rules?: MarketplaceRules
}

interface SectionProps {
  label: string
  copyText: string
  children: ReactNode
  counter?: ReactNode
}

function Section({ label, copyText, children, counter }: SectionProps) {
  return (
    <Box>
      <HStack justify="space-between" mb={1}>
        <Text fontSize="xs" fontWeight="bold" textTransform="uppercase" color="gray.500">
          {label}
        </Text>
        <HStack gap={2}>
          {counter}
          <CopyButton text={copyText} />
        </HStack>
      </HStack>
      {children}
    </Box>
  )
}

export function ListingPreview({ listing, rules }: ListingPreviewProps) {
  return (
    <Stack gap={5}>
      <HStack justify="space-between" wrap="wrap">
        <Heading size="md">Generated listing</Heading>
        <HStack>
          <Badge colorPalette="purple">{listing.marketplace}</Badge>
          <Badge>{listing.language}</Badge>
          <CopyButton size="sm" label="Copy all" text={buildListingText(listing)} />
        </HStack>
      </HStack>
      <ValidationBadges warnings={listing.validation_warnings} />
      <Section
        label="Title"
        copyText={listing.title}
        counter={rules ? <CharCounter value={listing.title} max={rules.title_max_length} /> : undefined}
      >
        <Text fontWeight="semibold">{listing.title}</Text>
      </Section>
      <Section label="Bullets" copyText={listing.bullets.join('\n')}>
        <Stack as="ul" gap={2} pl={5}>
          {listing.bullets.map((b, i) => (
            <Text as="li" key={i}>
              {b}
            </Text>
          ))}
        </Stack>
      </Section>
      <Section
        label="Description"
        copyText={listing.description}
        counter={rules ? <CharCounter value={listing.description} max={rules.description_max_length} /> : undefined}
      >
        <Text whiteSpace="pre-wrap">{listing.description}</Text>
      </Section>
      <Section label="Keywords" copyText={listing.keywords.join(', ')}>
        <HStack wrap="wrap" gap={2}>
          {listing.keywords.map((k, i) => (
            <Badge key={`${k}-${i}`} variant="subtle" colorPalette="pink">
              {k}
            </Badge>
          ))}
        </HStack>
      </Section>
    </Stack>
  )
}
