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

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    const { count: totalReviews } = await db
      .from('reviews')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', resolved.userId)
      .gte('review_created_at', startOfMonth)

    const { data: ratingData } = await db
      .from('reviews')
      .select('star_rating')
      .eq('user_id', resolved.userId)
      .gte('review_created_at', startOfMonth)

    let averageRating = 0
    if (ratingData && ratingData.length > 0) {
      const sum = ratingData.reduce((acc, r) => acc + r.star_rating, 0)
      averageRating = Math.round((sum / ratingData.length) * 10) / 10
    }

    const { count: awaitingReply } = await db
      .from('reviews')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', resolved.userId)
      .in('status', ['new', 'reply_generated'])

    const { count: publishedReplies } = await db
      .from('reviews')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', resolved.userId)
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
