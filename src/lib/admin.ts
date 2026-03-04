import { createClient } from '@/lib/supabase/server'

/**
 * Resolves the effective user ID for API routes.
 *
 * If the logged-in user is the admin (matches ADMIN_EMAIL) and an
 * `impersonate` query param is provided, returns that user ID instead.
 * Otherwise returns the logged-in user's own ID.
 *
 * Returns null if unauthenticated.
 */
export async function resolveUserId(
  request: Request
): Promise<{ userId: string; isImpersonating: boolean } | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  // Check for impersonation
  const url = new URL(request.url)
  const impersonateId = url.searchParams.get('impersonate')

  if (impersonateId) {
    const adminEmail = process.env.ADMIN_EMAIL
    if (adminEmail && user.email === adminEmail) {
      return { userId: impersonateId, isImpersonating: true }
    }
    // Non-admin trying to impersonate — ignore silently
  }

  return { userId: user.id, isImpersonating: false }
}

/**
 * Check if the current user is the admin.
 */
export async function isAdmin(): Promise<boolean> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return false

  const adminEmail = process.env.ADMIN_EMAIL
  return !!adminEmail && user.email === adminEmail
}
