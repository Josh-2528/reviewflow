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

    // Use admin client when impersonating (bypasses RLS)
    const db = resolved.isImpersonating
      ? createAdminClient()
      : await createClient()

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')

    let query = db
      .from('reviews')
      .select('*, reply:replies(*)')
      .eq('user_id', resolved.userId)
      .order('review_created_at', { ascending: false })

    if (status === 'needs_reply') {
      query = query.in('status', ['new', 'reply_generated'])
    } else if (status === 'published') {
      query = query.eq('status', 'published')
    } else if (status === 'skipped') {
      query = query.eq('status', 'skipped')
    }

    const { data: reviews, error } = await query

    if (error) {
      console.error('Error fetching reviews:', error)
      return NextResponse.json(
        { error: 'Failed to fetch reviews' },
        { status: 500 }
      )
    }

    const formattedReviews = reviews.map((review) => ({
      ...review,
      reply: Array.isArray(review.reply) ? review.reply[0] || null : review.reply,
    }))

    return NextResponse.json({ reviews: formattedReviews })
  } catch (error) {
    console.error('Reviews API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
