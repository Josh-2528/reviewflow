import { createAdminClient } from '@/lib/supabase/admin'

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_ACCOUNT_API = 'https://mybusinessaccountmanagement.googleapis.com/v1'
const GOOGLE_BUSINESS_API = 'https://mybusinessbusinessinformation.googleapis.com/v1'
const GOOGLE_REVIEWS_API = 'https://mybusiness.googleapis.com/v4'

// Build Google OAuth URL
export function getGoogleAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/business.manage',
    access_type: 'offline',
    prompt: 'consent',
    state,
  })

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

// Exchange authorization code for tokens
export async function exchangeCodeForTokens(code: string) {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
      grant_type: 'authorization_code',
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Token exchange failed: ${error}`)
  }

  return response.json()
}

// Refresh an expired access token
export async function refreshAccessToken(refreshToken: string): Promise<string> {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: 'refresh_token',
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to refresh access token')
  }

  const data = await response.json()
  return data.access_token
}

// Make authenticated Google API request with auto-refresh
async function googleApiRequest(
  url: string,
  userId: string,
  options: RequestInit = {}
): Promise<Response> {
  const supabase = createAdminClient()

  const { data: user, error } = await supabase
    .from('users')
    .select('google_access_token, google_refresh_token')
    .eq('id', userId)
    .single()

  if (error || !user?.google_access_token) {
    throw new Error('User not connected to Google')
  }

  // Try with current token
  let response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${user.google_access_token}`,
      'Content-Type': 'application/json',
    },
  })

  // If unauthorized, try refreshing token
  if (response.status === 401 && user.google_refresh_token) {
    try {
      const newAccessToken = await refreshAccessToken(user.google_refresh_token)

      // Save new token
      await supabase
        .from('users')
        .update({ google_access_token: newAccessToken })
        .eq('id', userId)

      // Retry request
      response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${newAccessToken}`,
          'Content-Type': 'application/json',
        },
      })
    } catch {
      // Mark Google as disconnected
      await supabase
        .from('users')
        .update({
          google_connected: false,
          google_access_token: null,
        })
        .eq('id', userId)
      throw new Error('Google connection expired. Please reconnect.')
    }
  }

  return response
}

// List all accounts for a user
export async function listAccounts(userId: string) {
  const response = await googleApiRequest(
    `${GOOGLE_ACCOUNT_API}/accounts`,
    userId
  )

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`Failed to list Google Business accounts: ${errText}`)
  }

  return response.json()
}

// List locations for an account
export async function listLocations(userId: string, accountId: string) {
  const response = await googleApiRequest(
    `${GOOGLE_BUSINESS_API}/${accountId}/locations?readMask=name,title,storefrontAddress`,
    userId
  )

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`Failed to list Google Business locations: ${errText}`)
  }

  return response.json()
}

// Fetch reviews for a location
export async function fetchReviews(
  userId: string,
  accountId: string,
  locationId: string
) {
  const response = await googleApiRequest(
    `${GOOGLE_REVIEWS_API}/accounts/${accountId}/locations/${locationId}/reviews`,
    userId
  )

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`Failed to fetch reviews: ${errText}`)
  }

  return response.json()
}

// Post a reply to a review
export async function postReply(
  userId: string,
  accountId: string,
  locationId: string,
  reviewId: string,
  replyText: string
) {
  const response = await googleApiRequest(
    `${GOOGLE_REVIEWS_API}/accounts/${accountId}/locations/${locationId}/reviews/${reviewId}/reply`,
    userId,
    {
      method: 'PUT',
      body: JSON.stringify({ comment: replyText }),
    }
  )

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`Failed to post reply: ${errText}`)
  }

  return response.json()
}

// Discover Google Business accounts and locations using a raw access token
// (no DB round-trip — used directly after OAuth token exchange)
export async function discoverLocationsWithToken(accessToken: string): Promise<{
  locations: Array<{
    accountId: string
    locationId: string
    locationName: string
    address: string | null
  }>
  error?: string
}> {
  try {
    // 1. List all accounts
    const accountsRes = await fetch(`${GOOGLE_ACCOUNT_API}/accounts`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!accountsRes.ok) {
      const errText = await accountsRes.text()
      console.error('Google accounts discovery failed:', accountsRes.status, errText)
      return { locations: [], error: `Failed to list accounts: ${accountsRes.status}` }
    }

    const accountsData = await accountsRes.json()
    const accounts = accountsData.accounts || []

    if (accounts.length === 0) {
      return { locations: [], error: 'No Google Business accounts found' }
    }

    // 2. List locations for each account
    const discoveredLocations: Array<{
      accountId: string
      locationId: string
      locationName: string
      address: string | null
    }> = []

    for (const account of accounts) {
      const accountName = account.name as string
      if (!accountName) continue

      try {
        const locationsRes = await fetch(
          `${GOOGLE_BUSINESS_API}/${accountName}/locations?readMask=name,title,storefrontAddress`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          }
        )

        if (!locationsRes.ok) {
          console.error(`Failed to list locations for ${accountName}:`, locationsRes.status)
          continue
        }

        const locationsData = await locationsRes.json()
        const locs = locationsData.locations || []

        for (const loc of locs) {
          const locName = loc.name as string
          if (!locName) continue

          const accountIdMatch = accountName.match(/accounts\/(.+)/)
          const accountId = accountIdMatch ? accountIdMatch[1] : accountName

          const locationIdMatch = locName.match(/locations\/(.+)/)
          const locationId = locationIdMatch ? locationIdMatch[1] : locName

          const addr = loc.storefrontAddress as Record<string, unknown> | undefined
          let address: string | null = null
          if (addr) {
            const parts = [
              addr.addressLines ? (addr.addressLines as string[]).join(', ') : null,
              addr.locality,
              addr.administrativeArea,
              addr.postalCode,
            ].filter(Boolean)
            address = parts.join(', ') || null
          }

          discoveredLocations.push({
            accountId,
            locationId,
            locationName: (loc.title as string) || 'Unnamed Location',
            address,
          })
        }
      } catch (err) {
        console.error(`Failed to list locations for ${accountName}:`, err)
      }
    }

    return { locations: discoveredLocations }
  } catch (err) {
    console.error('Google location discovery error:', err)
    return { locations: [], error: 'Discovery failed' }
  }
}

// Parse Google review data into our format
export function parseGoogleReview(review: Record<string, unknown>) {
  const reviewer = review.reviewer as Record<string, unknown> | undefined
  const starRating = review.starRating as string

  const ratingMap: Record<string, number> = {
    ONE: 1,
    TWO: 2,
    THREE: 3,
    FOUR: 4,
    FIVE: 5,
  }

  return {
    google_review_id: review.reviewId as string,
    reviewer_name: (reviewer?.displayName as string) || 'Anonymous',
    reviewer_photo_url: (reviewer?.profilePhotoUrl as string) || null,
    star_rating: ratingMap[starRating] || 5,
    review_text: (review.comment as string) || null,
    review_created_at: review.createTime as string,
    has_existing_reply: !!(review.reviewReply as Record<string, unknown>),
  }
}
