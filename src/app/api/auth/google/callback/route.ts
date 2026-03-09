import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { exchangeCodeForTokens } from '@/lib/google'

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
    const [userId, returnTo] = state.includes(':') ? state.split(':') : [state, 'onboarding']
    const redirectPath = returnTo === 'settings' ? '/settings' : '/onboarding'

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code)

    // Store tokens in user profile
    const supabase = createAdminClient()

    const { error: updateError } = await supabase
      .from('users')
      .update({
        google_access_token: tokens.access_token,
        google_refresh_token: tokens.refresh_token,
        google_connected: true,
      })
      .eq('id', userId)

    if (updateError) {
      console.error('Failed to store tokens:', updateError)
      return NextResponse.redirect(
        new URL(`${redirectPath}?error=storage_failed`, request.url)
      )
    }

    // Redirect back to the originating page
    return NextResponse.redirect(
      new URL(`${redirectPath}?google=connected`, request.url)
    )
  } catch (error) {
    console.error('Google callback error:', error)
    return NextResponse.redirect(
      new URL('/onboarding?error=callback_failed', request.url)
    )
  }
}
