import type { Listing } from '../../types'

export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // fall through to legacy path
  }
  try {
    const area = document.createElement('textarea')
    area.value = text
    area.setAttribute('readonly', '')
    area.setAttribute('aria-hidden', 'true')
    area.className = 'clipboard-fallback'
    document.body.appendChild(area)
    area.select()
    const ok = document.execCommand('copy')
    area.remove()
    return ok
  } catch {
    return false
  }
}

export function buildListingText(listing: Pick<Listing, 'title' | 'bullets' | 'description' | 'keywords'>): string {
  const bullets = listing.bullets.map((b) => `- ${b}`).join('\n')
  return `${listing.title}\n\n${bullets}\n\n${listing.description}\n\nKeywords: ${listing.keywords.join(', ')}`
}
