import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendWeeklySummaryEmail } from '@/lib/email'

// Weekly summary cron — runs every Monday at 9:00 AM UTC
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const adminClient = createAdminClient()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  // Get all users who have weekly summary enabled
  const { data: users, error } = await adminClient
    .from('users')
    .select('id, email, business_name, email_weekly_summary')
    .eq('email_weekly_summary', true)

  if (error || !users) {
    console.error('Weekly summary cron: Failed to fetch users:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }

  // Date range: last 7 days
  const now = new Date()
  const weekAgo = new Date(now)
  weekAgo.setDate(weekAgo.getDate() - 7)
  const weekAgoIso = weekAgo.toISOString()

  let sent = 0
  let skipped = 0

  for (const user of users) {
    try {
      // Get reviews from the last 7 days
      const { data: reviews } = await adminClient
        .from('reviews')
        .select('star_rating, status')
        .eq('user_id', user.id)
        .gte('review_created_at', weekAgoIso)

      if (!reviews || reviews.length === 0) {
        // No reviews this week — skip sending
        skipped++
        continue
      }

      const totalReviews = reviews.length
      const sumRatings = reviews.reduce((sum, r) => sum + r.star_rating, 0)
      const averageRating = Math.round((sumRatings / totalReviews) * 10) / 10
      const repliesPublished = reviews.filter((r) => r.status === 'published').length

      // Build star breakdown
      const breakdown: { stars: number; count: number }[] = []
      for (let s = 5; s >= 1; s--) {
        const count = reviews.filter((r) => r.star_rating === s).length
        breakdown.push({ stars: s, count })
      }

      await sendWeeklySummaryEmail({
        to: user.email,
        businessName: user.business_name || 'Your Business',
        totalReviews,
        averageRating,
        repliesPublished,
        newReviewBreakdown: breakdown,
        dashboardUrl: `${appUrl}/dashboard`,
      })

      sent++
    } catch (err) {
      console.error(`Weekly summary failed for user ${user.id}:`, err)
    }
  }

  return NextResponse.json({
    message: 'Weekly summary cron completed',
    sent,
    skipped,
    total_users: users.length,
  })
}
