import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { resolveUserId } from '@/lib/admin'
import { getUserPlanStatus, getTrialDaysRemaining, type PlanStatus } from '@/lib/stripe'

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const allowedFields = [
      'business_name',
      'business_location',
      'tone_preference',
      'custom_instructions',
      'auto_publish',
      'auto_publish_stars',
      'google_account_id',
      'google_location_id',
      'google_connected',
      'google_access_token',
      'google_refresh_token',
      'onboarding_completed',
      'email_new_review',
      'email_weekly_summary',
    ]

    // Check for AI prompt setting fields (contact details, sign-off)
    const aiFields: Record<string, string> = {
      ai_contact_email: 'contact_email',
      ai_contact_phone: 'contact_phone',
      ai_contact_reference_style: 'contact_reference_style',
      ai_contact_include_on: 'contact_include_on',
      ai_sign_off: 'sign_off',
    }

    const aiUpdates: Record<string, unknown> = {}
    for (const [bodyKey, dbKey] of Object.entries(aiFields)) {
      if (bodyKey in body) {
        aiUpdates[dbKey] = body[bodyKey]
      }
    }

    const adminClient = createAdminClient()

    // Save AI prompt settings if any
    if (Object.keys(aiUpdates).length > 0) {
      const { data: existing } = await adminClient
        .from('ai_prompt_settings')
        .select('id')
        .eq('user_id', user.id)
        .is('location_id', null)
        .single()

      if (existing) {
        await adminClient.from('ai_prompt_settings').update(aiUpdates).eq('id', existing.id)
      } else {
        await adminClient.from('ai_prompt_settings').insert({ user_id: user.id, ...aiUpdates })
      }
    }

    // Save user profile fields
    const updates: Record<string, unknown> = {}
    for (const field of allowedFields) {
      if (field in body) {
        updates[field] = body[field]
      }
    }

    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await adminClient
        .from('users')
        .update(updates)
        .eq('id', user.id)

      if (updateError) {
        console.error('Settings update error:', updateError)
        return NextResponse.json(
          { error: 'Failed to update settings' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({ message: 'Settings updated' })
  } catch (error) {
    console.error('Settings error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const resolved = await resolveUserId(request)
    if (!resolved) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = resolved.isImpersonating
      ? createAdminClient()
      : await createClient()

    const { data: profile, error } = await db
      .from('users')
      .select('*')
      .eq('id', resolved.userId)
      .single()

    if (error || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    // Strip sensitive fields
    const { google_access_token, google_refresh_token, ...safeProfile } = profile

    // Calculate plan status and trial days remaining
    const planStatus: PlanStatus = getUserPlanStatus(profile)
    const trialDaysRemaining = getTrialDaysRemaining(profile.trial_started_at)

    // Fetch locations
    const adminClient = createAdminClient()
    const { data: locations } = await adminClient
      .from('locations')
      .select('*')
      .eq('user_id', resolved.userId)
      .order('created_at', { ascending: true })

    // Fetch AI prompt settings (user's default = location_id is null)
    const { data: aiSettings } = await adminClient
      .from('ai_prompt_settings')
      .select('contact_email, contact_phone, contact_reference_style, contact_include_on, sign_off')
      .eq('user_id', resolved.userId)
      .is('location_id', null)
      .single()

    return NextResponse.json({
      profile: safeProfile,
      planStatus,
      trialDaysRemaining,
      locations: locations || [],
      aiSettings: aiSettings || null,
    })
  } catch (error) {
    console.error('Get settings error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
