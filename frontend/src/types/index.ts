export type MarketplaceId = 'amazon' | 'flipkart' | 'meesho' | 'shopify'
export type ListingStatus = 'draft' | 'final'

export interface User {
  id: number
  email: string
  full_name: string | null
  is_active: boolean
  is_verified: boolean
  oauth_provider: string | null
  created_at: string
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface SellerProfile {
  id: number
  user_id: number
  name: string
  brand_name: string | null
  brand_voice: string | null
  default_marketplace: MarketplaceId | null
  default_language: string | null
  created_at: string
  updated_at: string
}

export interface SellerProfileInput {
  name: string
  brand_name?: string | null
  brand_voice?: string | null
  default_marketplace?: MarketplaceId | null
  default_language?: string | null
}

export interface Product {
  id: number
  user_id: number
  seller_profile_id: number | null
  name: string
  category: string | null
  brand: string | null
  key_features: string[]
  price: number | null
  target_audience: string | null
  attributes: Record<string, string>
  created_at: string
  updated_at: string
}

export interface ProductInput {
  name: string
  seller_profile_id?: number | null
  category?: string | null
  brand?: string | null
  key_features?: string[]
  price?: number | null
  target_audience?: string | null
  attributes?: Record<string, string>
}

export interface ValidationWarning {
  field: string
  message: string
}

export interface Listing {
  id: number
  user_id: number
  product_id: number
  marketplace: MarketplaceId
  language: string
  title: string
  bullets: string[]
  description: string
  keywords: string[]
  validation_warnings: ValidationWarning[]
  model_used: string | null
  status: ListingStatus
  created_at: string
  updated_at: string
}

export interface ListingUpdateInput {
  title?: string
  bullets?: string[]
  description?: string
  keywords?: string[]
  status?: ListingStatus
}

export interface GenerateListingRequest {
  product_id: number
  marketplace: MarketplaceId
  language: string
}

export interface RegenerateListingRequest {
  instructions?: string
}

export interface MarketplaceRules {
  title_max_length: number
  bullet_count: number
  bullet_max_length: number
  description_max_length: number
  keyword_max_length: number
}

export interface Language {
  code: string
  name: string
}

export interface Marketplace {
  id: MarketplaceId
  name: string
  rules: MarketplaceRules
}

export interface MarketplacesResponse {
  marketplaces: Marketplace[]
  languages: Language[]
}

export interface UsageInfo {
  period: string
  generations_used: number
  generations_limit: number
}

export interface DashboardStats {
  total_sellers?: number
  total_products: number
  total_listings: number
  listings_by_marketplace: Record<string, number>
  listings_by_language?: Record<string, number>
  recent_listings?: Listing[]
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
}
