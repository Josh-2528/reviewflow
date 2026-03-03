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

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    // Total reviews this month
    const { count: totalReviews } = await supabase
      .from('reviews')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('review_created_at', startOfMonth)

    // Average rating this month
    const { data: ratingData } = await supabase
      .from('reviews')
      .select('star_rating')
      .eq('user_id', user.id)
      .gte('review_created_at', startOfMonth)

    let averageRating = 0
    if (ratingData && ratingData.length > 0) {
      const sum = ratingData.reduce((acc, r) => acc + r.star_rating, 0)
      averageRating = Math.round((sum / ratingData.length) * 10) / 10
    }

    // Reviews awaiting reply
    const { count: awaitingReply } = await supabase
      .from('reviews')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .in('status', ['new', 'reply_generated'])

    // Replies published this month
    const { count: publishedReplies } = await supabase
      .from('reviews')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'published')
      .gte('created_at', startOfMonth)

    return NextResponse.json({
      total_reviews_this_month: totalReviews || 0,
      average_rating_this_month: averageRating,
      reviews_awaiting_reply: awaitingReply || 0,
      replies_published_this_month: publishedReplies || 0,
    })
  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
