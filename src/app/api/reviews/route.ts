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
    const locationId = searchParams.get('location_id')
    const sortBy = searchParams.get('sort') || 'newest'
    const starFilter = searchParams.get('star_rating')

    let query = db
      .from('reviews')
      .select('*, reply:replies(*), location:locations(id, location_name)')
      .eq('user_id', resolved.userId)

    // Location filter
    if (locationId) {
      query = query.eq('location_id', locationId)
    }

    // Status filter
    if (status === 'needs_reply') {
      query = query.in('status', ['new', 'reply_generated'])
    } else if (status === 'published') {
      query = query.eq('status', 'published')
    } else if (status === 'skipped') {
      query = query.eq('status', 'skipped')
    }

    // Star rating filter
    if (starFilter) {
      const starNum = parseInt(starFilter, 10)
      if (starNum >= 1 && starNum <= 5) {
        query = query.eq('star_rating', starNum)
      }
    }

    // Sort
    switch (sortBy) {
      case 'oldest':
        query = query.order('review_created_at', { ascending: true })
        break
      case 'highest':
        query = query.order('star_rating', { ascending: false }).order('review_created_at', { ascending: false })
        break
      case 'lowest':
        query = query.order('star_rating', { ascending: true }).order('review_created_at', { ascending: false })
        break
      default: // newest
        query = query.order('review_created_at', { ascending: false })
        break
    }

    const { data: reviews, error } = await query

    if (error) {
      console.error('Error fetching reviews:', error)
      return NextResponse.json(
        { error: 'Failed to fetch reviews' },
        { status: 500 }
      )
    }

    const formattedReviews = (reviews || []).map((review) => ({
      ...review,
      reply: Array.isArray(review.reply) ? review.reply[0] || null : review.reply,
      location: Array.isArray(review.location) ? review.location[0] || null : review.location,
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
