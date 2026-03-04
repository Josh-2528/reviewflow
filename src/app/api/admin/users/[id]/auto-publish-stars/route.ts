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

// PUT /api/admin/users/[id]/auto-publish-stars — set a user's auto-publish star ratings
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await verifyAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { auto_publish_stars } = body

    if (!Array.isArray(auto_publish_stars)) {
      return NextResponse.json(
        { error: 'auto_publish_stars must be an array of numbers' },
        { status: 400 }
      )
    }

    // Validate: only 1-5 allowed
    const valid = auto_publish_stars.every(
      (s: unknown) => typeof s === 'number' && s >= 1 && s <= 5
    )
    if (!valid) {
      return NextResponse.json(
        { error: 'auto_publish_stars must only contain numbers 1-5' },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()

    const { error: updateError } = await adminClient
      .from('users')
      .update({ auto_publish_stars })
      .eq('id', id)

    if (updateError) {
      console.error('Update auto_publish_stars error:', updateError)
      return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Auto-publish stars updated' })
  } catch (error) {
    console.error('Auto-publish stars error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
