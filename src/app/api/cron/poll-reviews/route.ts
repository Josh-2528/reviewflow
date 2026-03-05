import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { fetchReviews, parseGoogleReview, postReply } from '@/lib/google'
import { generateReviewReply } from '@/lib/claude'
import { canAutoPoll, canGenerateAIReplies, canAutoPublish } from '@/lib/stripe'
import { sendNewReviewEmail } from '@/lib/email'

// Cron job to poll reviews for all connected users
// Runs every 15 minutes via Vercel cron
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const adminClient = createAdminClient()

  // Get all users with valid Google connections (either via locations or legacy user-level)
  const { data: users, error } = await adminClient
    .from('users')
    .select('*')

  if (error || !users) {
    console.error('Cron: Failed to fetch users:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }

  const results: { userId: string; newReviews: number; errors: string[] }[] = []

  for (const user of users) {
    const userResult = { userId: user.id, newReviews: 0, errors: [] as string[] }

    // Only auto-poll for users with active trial or pro subscription
    if (!canAutoPoll(user)) {
      continue
    }

    // Build list of sources: locations first, then legacy
    interface PollSource {
      googleAccountId: string
      googleLocationId: string
      locationId: string | null
      locationName: string | null
      contactEmail: string | null
    }

    const sources: PollSource[] = []

    // Fetch locations for this user
    const { data: locations } = await adminClient
      .from('locations')
      .select('*')
      .eq('user_id', user.id)

    if (locations && locations.length > 0) {
      for (const loc of locations) {
        if (loc.google_account_id && loc.google_location_id) {
          sources.push({
            googleAccountId: loc.google_account_id,
            googleLocationId: loc.google_location_id,
            locationId: loc.id,
            locationName: loc.location_name,
            contactEmail: loc.contact_email,
          })
        }
      }
    }

    // Fallback to legacy connection
    if (sources.length === 0 && user.google_connected && user.google_account_id && user.google_location_id) {
      sources.push({
        googleAccountId: user.google_account_id,
        googleLocationId: user.google_location_id,
        locationId: null,
        locationName: null,
        contactEmail: null,
      })
    }

    if (sources.length === 0) continue

    for (const source of sources) {
      try {
        // Fetch reviews from Google
        const reviewsData = await fetchReviews(
          user.id,
          source.googleAccountId,
          source.googleLocationId
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
              location_id: source.locationId,
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
            location_id: source.locationId,
            details: `New ${parsed.star_rating}-star review from ${parsed.reviewer_name}${source.locationName ? ` at ${source.locationName}` : ''}`,
          })

          // Send new review email notification
          const emailTo = source.contactEmail || (user.email_new_review !== false ? user.email : null)
          if (emailTo) {
            const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
            sendNewReviewEmail({
              to: emailTo,
              businessName: source.locationName || user.business_name || 'Your Business',
              reviewerName: parsed.reviewer_name,
              starRating: parsed.star_rating,
              reviewText: parsed.review_text,
              dashboardUrl: `${appUrl}/dashboard`,
            }).catch((err) => console.error('Email send failed:', err))
          }

          if (parsed.has_existing_reply) continue

          // AI replies require active trial or pro
          if (!canGenerateAIReplies(user)) continue

          // Generate AI reply
          try {
            const replyText = await generateReviewReply({
              userId: user.id,
              businessName: source.locationName || user.business_name || 'Our Business',
              businessLocation: user.business_location || '',
              tonePreference: user.tone_preference || 'friendly and professional',
              customInstructions: user.custom_instructions,
              starRating: parsed.star_rating,
              reviewText: parsed.review_text,
              reviewerName: parsed.reviewer_name,
              locationId: source.locationId,
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
              location_id: source.locationId,
              details: `AI reply generated for ${parsed.reviewer_name}'s review`,
            })

            // Smart auto-publish
            const autoPublishStars: number[] = Array.isArray(user.auto_publish_stars)
              ? user.auto_publish_stars
              : [4, 5]
            const shouldAutoPublish = canAutoPublish(user) && autoPublishStars.includes(parsed.star_rating)

            if (shouldAutoPublish) {
              try {
                await postReply(
                  user.id,
                  source.googleAccountId,
                  source.googleLocationId,
                  parsed.google_review_id,
                  replyText
                )

                await adminClient
                  .from('replies')
                  .update({
                    status: 'published',
                    auto_published: true,
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
                  location_id: source.locationId,
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
        console.error(`Cron failed for user ${user.id}, location ${source.locationId}:`, err)
        userResult.errors.push(`Polling failed: ${(err as Error).message}`)
      }
    }

    results.push(userResult)
  }

  return NextResponse.json({
    message: 'Cron completed',
    processed: results.length,
    results,
  })
}
