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
