import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { exchangeCodeForTokens, discoverLocationsWithToken } from '@/lib/google'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state') // "userId:returnTo" or just "userId"
    const error = searchParams.get('error')

    if (error) {
      return NextResponse.redirect(
        new URL('/onboarding?error=google_denied', request.url)
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/onboarding?error=missing_params', request.url)
      )
    }

    // Parse state: "userId:returnTo" (e.g. "abc123:settings" or just "abc123")
    const colonIndex = state.indexOf(':')
    const userId = colonIndex >= 0 ? state.substring(0, colonIndex) : state
    const returnTo = colonIndex >= 0 ? state.substring(colonIndex + 1) : 'onboarding'
    const redirectPath = returnTo === 'settings' ? '/settings' : '/onboarding'

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code)

    // Validate that we actually got tokens
    if (!tokens.access_token) {
      console.error('Token exchange returned no access_token:', JSON.stringify(Object.keys(tokens)))
      return NextResponse.redirect(
        new URL(`${redirectPath}?error=no_token`, request.url)
      )
    }

    // Store tokens in user profile — use .select().single() to verify the write
    const supabase = createAdminClient()

    const updatePayload: Record<string, unknown> = {
      google_access_token: tokens.access_token,
      google_connected: true,
    }
    // Only overwrite refresh_token if Google returned one (it doesn't on re-auth)
    if (tokens.refresh_token) {
      updatePayload.google_refresh_token = tokens.refresh_token
    }

    const { data: updated, error: updateError } = await supabase
      .from('users')
      .update(updatePayload)
      .eq('id', userId)
      .select('id, google_access_token')
      .single()

    if (updateError || !updated) {
      console.error('Failed to store tokens:', updateError, 'userId:', userId)
      return NextResponse.redirect(
        new URL(`${redirectPath}?error=storage_failed`, request.url)
      )
    }

    // Verify the token was actually persisted
    if (!updated.google_access_token) {
      console.error('Token save verification failed — google_access_token is null after update')
      return NextResponse.redirect(
        new URL(`${redirectPath}?error=storage_failed`, request.url)
      )
    }

    // ── Server-side location discovery using the fresh token ──
    // Use the token directly (no DB round-trip) to avoid timing issues
    const discovery = await discoverLocationsWithToken(tokens.access_token)

    if (discovery.locations.length === 1) {
      // Auto-assign the single location
      const loc = discovery.locations[0]

      // Update legacy user-level fields
      await supabase
        .from('users')
        .update({
          google_account_id: loc.accountId,
          google_location_id: loc.locationId,
        })
        .eq('id', userId)

      // Find or create a location record
      const { data: existingLocs } = await supabase
        .from('locations')
        .select('id, google_account_id, google_location_id')
        .eq('user_id', userId)

      const locations = existingLocs || []
      const unconnected = locations.find(
        (l) => !l.google_account_id && !l.google_location_id
      )

      if (unconnected) {
        // Update existing unconnected location
        await supabase
          .from('locations')
          .update({
            google_account_id: loc.accountId,
            google_location_id: loc.locationId,
            location_name: loc.locationName,
            location_address: loc.address,
          })
          .eq('id', unconnected.id)
      } else if (locations.length < 3) {
        // Create new location record
        await supabase.from('locations').insert({
          user_id: userId,
          google_account_id: loc.accountId,
          google_location_id: loc.locationId,
          location_name: loc.locationName,
          location_address: loc.address,
          is_primary: locations.length === 0,
        })
      }

      return NextResponse.redirect(
        new URL(`${redirectPath}?google=connected&locations_found=1`, request.url)
      )
    }

    if (discovery.locations.length > 1) {
      // Multiple locations — redirect and let the frontend show a picker
      return NextResponse.redirect(
        new URL(`${redirectPath}?google=connected&locations_found=${discovery.locations.length}`, request.url)
      )
    }

    // No locations found (or discovery failed) — still redirect as connected
    return NextResponse.redirect(
      new URL(`${redirectPath}?google=connected&locations_found=0`, request.url)
    )
  } catch (error) {
    console.error('Google callback error:', error)
    return NextResponse.redirect(
      new URL('/onboarding?error=callback_failed', request.url)
    )
  }
}
