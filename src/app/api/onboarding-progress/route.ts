import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { resolveUserId } from '@/lib/admin'

// GET /api/onboarding-progress — returns checklist state
export async function GET(request: NextRequest) {
  try {
    const resolved = await resolveUserId(request)
    if (!resolved) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = resolved.isImpersonating
      ? createAdminClient()
      : await createClient()

    // Get user profile
    const { data: profile } = await db
      .from('users')
      .select('google_connected, email_new_review, email_weekly_summary')
      .eq('id', resolved.userId)
      .single()

    // Check if any reply has been approved/edited (reviewed)
    const { count: reviewedCount } = await db
      .from('activity_log')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', resolved.userId)
      .in('action', ['reply_approved', 'reply_edited'])

    // Check if any reply has been published
    const { count: publishedCount } = await db
      .from('reviews')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', resolved.userId)
      .eq('status', 'published')

    // Check if user has contact details configured
    const adminClient = createAdminClient()
    const { data: aiSettings } = await adminClient
      .from('ai_prompt_settings')
      .select('contact_email')
      .eq('user_id', resolved.userId)

    const hasContactDetails = (aiSettings || []).some(
      (s) => s.contact_email && s.contact_email.trim() !== ''
    )

    // Check for locations
    const { count: locationCount } = await adminClient
      .from('locations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', resolved.userId)

    return NextResponse.json({
      google_connected: profile?.google_connected ?? false,
      has_locations: (locationCount ?? 0) > 0,
      has_reviewed_reply: (reviewedCount ?? 0) > 0,
      has_published_reply: (publishedCount ?? 0) > 0,
      has_contact_details: hasContactDetails,
      email_notifications_on:
        (profile?.email_new_review ?? false) || (profile?.email_weekly_summary ?? false),
    })
  } catch (error) {
    console.error('Onboarding progress error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
