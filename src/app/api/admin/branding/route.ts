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

// GET /api/admin/branding — public read (no auth required)
export async function GET() {
  try {
    const adminClient = createAdminClient()
    const { data, error } = await adminClient
      .from('branding_settings')
      .select('app_name, logo_url, primary_color')
      .eq('id', 1)
      .single()

    if (error || !data) {
      return NextResponse.json({
        app_name: 'ReviewFlow',
        logo_url: null,
        primary_color: '#2563eb',
      })
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({
      app_name: 'ReviewFlow',
      logo_url: null,
      primary_color: '#2563eb',
    })
  }
}

// PUT /api/admin/branding — admin only
export async function PUT(request: NextRequest) {
  try {
    const admin = await verifyAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    const updates: Record<string, unknown> = {}

    if ('app_name' in body && typeof body.app_name === 'string' && body.app_name.trim()) {
      updates.app_name = body.app_name.trim()
    }
    if ('logo_url' in body) {
      updates.logo_url = body.logo_url || null
    }
    if ('primary_color' in body && typeof body.primary_color === 'string') {
      // Validate hex color
      if (/^#[0-9a-fA-F]{6}$/.test(body.primary_color)) {
        updates.primary_color = body.primary_color
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields' }, { status: 400 })
    }

    const adminClient = createAdminClient()
    const { error } = await adminClient
      .from('branding_settings')
      .update(updates)
      .eq('id', 1)

    if (error) {
      console.error('Branding update error:', error)
      return NextResponse.json({ error: 'Failed to update branding' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Branding updated' })
  } catch (error) {
    console.error('Branding API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
