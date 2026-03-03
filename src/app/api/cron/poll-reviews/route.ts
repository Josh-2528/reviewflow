import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { fetchReviews, parseGoogleReview, postReply } from '@/lib/google'
import { generateReviewReply } from '@/lib/claude'
import { getPlanById, canReceiveReviews } from '@/lib/stripe'

// Cron job to poll reviews for all connected users
// Runs every 15 minutes via Vercel cron
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const adminClient = createAdminClient()

  // Get all users with valid Google connections
  const { data: users, error } = await adminClient
    .from('users')
    .select('*')
    .eq('google_connected', true)
    .not('google_account_id', 'is', null)
    .not('google_location_id', 'is', null)

  if (error || !users) {
    console.error('Cron: Failed to fetch users:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }

  const results: { userId: string; newReviews: number; errors: string[] }[] = []

  for (const user of users) {
    const userResult = { userId: user.id, newReviews: 0, errors: [] as string[] }

    // Only auto-poll for users on Pro or Business plans
    const plan = getPlanById(user.plan_id)
    if (!plan.autoPolling) {
      continue
    }

    try {
      // Fetch reviews from Google
      const reviewsData = await fetchReviews(
        user.id,
        user.google_account_id!,
        user.google_location_id!
      )

      const googleReviews = reviewsData.reviews || []

      for (const googleReview of googleReviews) {
        const parsed = parseGoogleReview(googleReview)

        // Check if already exists
        const { data: existing } = await adminClient
          .from('reviews')
          .select('id')
          .eq('google_review_id', parsed.google_review_id)
          .single()

        if (existing) continue

        // Save new review
        const { data: savedReview, error: saveError } = await adminClient
          .from('reviews')
          .insert({
            user_id: user.id,
            ...parsed,
            status: parsed.has_existing_reply ? 'published' : 'new',
          })
          .select()
          .single()

        if (saveError || !savedReview) {
          userResult.errors.push(`Save failed: ${parsed.google_review_id}`)
          continue
        }

        userResult.newReviews++

        // Log detection
        await adminClient.from('activity_log').insert({
          user_id: user.id,
          action: 'review_detected',
          review_id: savedReview.id,
          details: `New ${parsed.star_rating}-star review from ${parsed.reviewer_name}`,
        })

        if (parsed.has_existing_reply) continue

        // Gate: AI replies require Pro or Business
        if (!plan.aiReplies) continue

        // Generate AI reply
        try {
          const replyText = await generateReviewReply({
            businessName: user.business_name || 'Our Business',
            businessLocation: user.business_location || '',
            tonePreference: user.tone_preference || 'friendly and professional',
            customInstructions: user.custom_instructions,
            starRating: parsed.star_rating,
            reviewText: parsed.review_text,
          })

          await adminClient.from('replies').insert({
            review_id: savedReview.id,
            generated_text: replyText,
            final_text: replyText,
            status: 'pending',
          })

          await adminClient
            .from('reviews')
            .update({ status: 'reply_generated' })
            .eq('id', savedReview.id)

          await adminClient.from('activity_log').insert({
            user_id: user.id,
            action: 'reply_generated',
            review_id: savedReview.id,
            details: `AI reply generated for ${parsed.reviewer_name}'s review`,
          })

          // Auto-publish if enabled AND plan allows it
          if (user.auto_publish && plan.autoPublish) {
            try {
              await postReply(
                user.id,
                user.google_account_id!,
                user.google_location_id!,
                parsed.google_review_id,
                replyText
              )

              await adminClient
                .from('replies')
                .update({
                  status: 'published',
                  published_at: new Date().toISOString(),
                })
                .eq('review_id', savedReview.id)

              await adminClient
                .from('reviews')
                .update({ status: 'published' })
                .eq('id', savedReview.id)

              await adminClient.from('activity_log').insert({
                user_id: user.id,
                action: 'reply_published',
                review_id: savedReview.id,
                details: `Reply auto-published for ${parsed.reviewer_name}'s review`,
              })
            } catch (publishErr) {
              console.error(`Auto-publish failed for user ${user.id}:`, publishErr)
              await adminClient
                .from('replies')
                .update({ status: 'approved' })
                .eq('review_id', savedReview.id)
            }
          }
        } catch (aiErr) {
          console.error(`AI generation failed for user ${user.id}:`, aiErr)
          userResult.errors.push(`AI failed: ${parsed.google_review_id}`)
        }
      }
    } catch (err) {
      console.error(`Cron failed for user ${user.id}:`, err)
      userResult.errors.push(`Polling failed: ${(err as Error).message}`)
    }

    results.push(userResult)
  }

  return NextResponse.json({
    message: 'Cron completed',
    processed: results.length,
    results,
  })
}
