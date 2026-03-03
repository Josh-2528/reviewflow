import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') // filter: all, needs_reply, published, skipped

    let query = supabase
      .from('reviews')
      .select('*, reply:replies(*)')
      .eq('user_id', user.id)
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

    // Flatten reply from array to single object
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
