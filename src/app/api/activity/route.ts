import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: activities, error } = await supabase
      .from('activity_log')
      .select('*, review:reviews(reviewer_name, star_rating, review_text)')
      .eq('user_id', user.id)
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
