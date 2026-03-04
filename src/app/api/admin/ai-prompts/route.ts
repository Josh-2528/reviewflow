import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function verifyAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null
  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail || user.email !== adminEmail) return null
  return user
}

// GET /api/admin/ai-prompts?user_id=xxx (or no user_id for global)
export async function GET(request: NextRequest) {
  try {
    const admin = await verifyAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const url = new URL(request.url)
    const userId = url.searchParams.get('user_id')

    const adminClient = createAdminClient()

    if (userId) {
      // Get customer-specific settings
      const { data: customerSettings } = await adminClient
        .from('ai_prompt_settings')
        .select('*')
        .eq('user_id', userId)
        .single()

      // Also get global defaults for fallback display
      const { data: globalSettings } = await adminClient
        .from('ai_prompt_settings')
        .select('*')
        .is('user_id', null)
        .single()

      return NextResponse.json({
        customer: customerSettings || null,
        global: globalSettings || null,
      })
    } else {
      // Get global defaults
      const { data: globalSettings } = await adminClient
        .from('ai_prompt_settings')
        .select('*')
        .is('user_id', null)
        .single()

      return NextResponse.json({
        global: globalSettings || null,
      })
    }
  } catch (error) {
    console.error('Get AI prompts error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/admin/ai-prompts — upsert global or customer-specific settings
export async function PUT(request: NextRequest) {
  try {
    const admin = await verifyAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    const { user_id, ...fields } = body

    const adminClient = createAdminClient()

    const allowedFields = [
      'base_system_prompt',
      'star_1_instructions',
      'star_2_instructions',
      'star_3_instructions',
      'star_4_instructions',
      'star_5_instructions',
      'business_context',
      'custom_instructions',
      'contact_email',
      'contact_phone',
      'contact_reference_style',
      'contact_include_on',
      'tone',
      'custom_tone_description',
      'sign_off',
      'do_not_mention',
      'always_mention',
    ]

    const updates: Record<string, unknown> = {}
    for (const field of allowedFields) {
      if (field in fields) {
        updates[field] = fields[field]
      }
    }

    if (user_id) {
      // Upsert customer-specific row
      const { data: existing } = await adminClient
        .from('ai_prompt_settings')
        .select('id')
        .eq('user_id', user_id)
        .single()

      if (existing) {
        const { error } = await adminClient
          .from('ai_prompt_settings')
          .update(updates)
          .eq('user_id', user_id)

        if (error) {
          console.error('Update customer AI settings error:', error)
          return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
        }
      } else {
        const { error } = await adminClient
          .from('ai_prompt_settings')
          .insert({ user_id, ...updates })

        if (error) {
          console.error('Insert customer AI settings error:', error)
          return NextResponse.json({ error: 'Failed to create' }, { status: 500 })
        }
      }
    } else {
      // Update global defaults
      const { data: existing } = await adminClient
        .from('ai_prompt_settings')
        .select('id')
        .is('user_id', null)
        .single()

      if (existing) {
        const { error } = await adminClient
          .from('ai_prompt_settings')
          .update(updates)
          .eq('id', existing.id)

        if (error) {
          console.error('Update global AI settings error:', error)
          return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
        }
      } else {
        const { error } = await adminClient
          .from('ai_prompt_settings')
          .insert({ user_id: null, ...updates })

        if (error) {
          console.error('Insert global AI settings error:', error)
          return NextResponse.json({ error: 'Failed to create' }, { status: 500 })
        }
      }
    }

    return NextResponse.json({ message: 'AI prompt settings saved' })
  } catch (error) {
    console.error('Save AI prompts error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
