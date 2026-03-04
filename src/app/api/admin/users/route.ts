import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { PLANS } from '@/lib/stripe'

// Helper: verify the logged-in user is the admin
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

// GET /api/admin/users — list all users with review counts
export async function GET() {
  try {
    const admin = await verifyAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const adminClient = createAdminClient()

    // Get all users
    const { data: users, error } = await adminClient
      .from('users')
      .select('id, email, business_name, plan_id, google_connected, subscription_status, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Admin: Failed to fetch users:', error)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    // Get review counts per user
    const userIds = users.map((u) => u.id)
    const { data: reviewCounts } = await adminClient
      .from('reviews')
      .select('user_id')
      .in('user_id', userIds)

    const countMap: Record<string, number> = {}
    if (reviewCounts) {
      for (const r of reviewCounts) {
        countMap[r.user_id] = (countMap[r.user_id] || 0) + 1
      }
    }

    // Build enriched user list
    const enrichedUsers = users.map((u) => ({
      ...u,
      review_count: countMap[u.id] || 0,
    }))

    // Summary stats
    const totalUsers = users.length
    const totalReviews = Object.values(countMap).reduce((sum, c) => sum + c, 0)

    // MRR calculation
    let mrr = 0
    for (const u of users) {
      const planId = u.plan_id || 'free'
      if (
        planId in PLANS &&
        (u.subscription_status === 'active' || u.subscription_status === 'trialing')
      ) {
        mrr += PLANS[planId as keyof typeof PLANS].price
      }
    }

    return NextResponse.json({
      users: enrichedUsers,
      stats: {
        total_users: totalUsers,
        total_reviews: totalReviews,
        mrr,
      },
    })
  } catch (error) {
    console.error('Admin users error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
