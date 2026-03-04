import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { resolveUserId } from '@/lib/admin'

export async function GET(request: NextRequest) {
  try {
    const resolved = await resolveUserId(request)
    if (!resolved) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = resolved.isImpersonating
      ? createAdminClient()
      : await createClient()

    const { data: activities, error } = await db
      .from('activity_log')
      .select('*, review:reviews(reviewer_name, star_rating, review_text)')
      .eq('user_id', resolved.userId)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      console.error('Error fetching activity:', error)
      return NextResponse.json(
        { error: 'Failed to fetch activity log' },
        { status: 500 }
      )
    }

    return NextResponse.json({ activities })
  } catch (error) {
    console.error('Activity API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
