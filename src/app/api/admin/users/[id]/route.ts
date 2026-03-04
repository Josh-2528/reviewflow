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

// PUT /api/admin/users/[id] — update a user's plan
// DELETE /api/admin/users/[id] — delete a user
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
    const { plan_id } = body

    if (!plan_id || !['free', 'pro', 'business'].includes(plan_id)) {
      return NextResponse.json(
        { error: 'Invalid plan_id. Must be free, pro, or business.' },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()

    // Verify user exists
    const { data: user, error: findError } = await adminClient
      .from('users')
      .select('id, email')
      .eq('id', id)
      .single()

    if (findError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Update plan
    const updates: Record<string, unknown> = { plan_id }

    // If downgrading to free, clear subscription fields
    if (plan_id === 'free') {
      updates.subscription_status = null
      updates.stripe_subscription_id = null
      updates.subscription_current_period_end = null
    } else {
      // For admin-granted paid plans, mark as active
      updates.subscription_status = 'active'
    }

    const { error: updateError } = await adminClient
      .from('users')
      .update(updates)
      .eq('id', id)

    if (updateError) {
      console.error('Admin: Failed to update user plan:', updateError)
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
    }

    return NextResponse.json({
      message: `User ${user.email} plan changed to ${plan_id}`,
    })
  } catch (error) {
    console.error('Admin update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await verifyAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { id } = await params
    const adminClient = createAdminClient()

    // Verify user exists
    const { data: user, error: findError } = await adminClient
      .from('users')
      .select('id, email')
      .eq('id', id)
      .single()

    if (findError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Prevent deleting yourself
    if (user.id === admin.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own admin account' },
        { status: 400 }
      )
    }

    // Delete from public.users (cascade will remove reviews, replies, activity_log)
    const { error: deleteProfileError } = await adminClient
      .from('users')
      .delete()
      .eq('id', id)

    if (deleteProfileError) {
      console.error('Admin: Failed to delete user profile:', deleteProfileError)
      return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
    }

    // Delete from auth.users
    const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(id)

    if (deleteAuthError) {
      console.error('Admin: Failed to delete auth user:', deleteAuthError)
      // Profile is already gone, log but don't fail
    }

    return NextResponse.json({ message: `User ${user.email} deleted` })
  } catch (error) {
    console.error('Admin delete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
