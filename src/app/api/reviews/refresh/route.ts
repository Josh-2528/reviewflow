import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { fetchReviews, parseGoogleReview } from '@/lib/google'
import { generateReviewReply } from '@/lib/claude'
import { postReply } from '@/lib/google'
import { hasFullAccess, canGenerateAIReplies, canAutoPublish } from '@/lib/stripe'
import { sendNewReviewEmail } from '@/lib/email'

export async function POST() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminClient = createAdminClient()

    // Get user profile
    const { data: profile, error: profileError } = await adminClient
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    if (!profile.google_connected || !profile.google_account_id || !profile.google_location_id) {
      return NextResponse.json(
        { error: 'Google Business Profile not connected' },
        { status: 400 }
      )
    }

    // Check if user has full access (trial or pro)
    const userHasAccess = hasFullAccess(profile)
    if (!userHasAccess) {
      return NextResponse.json(
        { error: 'Your trial has ended. Subscribe to continue managing your reviews.' },
        { status: 403 }
      )
    }

    // Fetch reviews from Google
    let googleReviews
    try {
      const reviewsData = await fetchReviews(
        user.id,
        profile.google_account_id,
        profile.google_location_id
      )
      googleReviews = reviewsData.reviews || []
    } catch (error) {
      console.error('Error fetching Google reviews:', error)
      return NextResponse.json(
        { error: 'Failed to fetch reviews from Google. Please check your connection.' },
        { status: 502 }
      )
    }

    let newReviewCount = 0
    const errors: string[] = []
    const userCanAI = canGenerateAIReplies(profile)
    const userCanAutoPublish = canAutoPublish(profile)

    for (const googleReview of googleReviews) {
      const parsed = parseGoogleReview(googleReview)

      // Check if review already exists
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
        errors.push(`Failed to save review ${parsed.google_review_id}`)
        continue
      }

      newReviewCount++

      // Log review detection
      await adminClient.from('activity_log').insert({
        user_id: user.id,
        action: 'review_detected',
        review_id: savedReview.id,
        details: `New ${parsed.star_rating}-star review from ${parsed.reviewer_name}`,
      })

      // Send new review email notification
      if (profile.email_new_review !== false) {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        sendNewReviewEmail({
          to: profile.email,
          businessName: profile.business_name || 'Your Business',
          reviewerName: parsed.reviewer_name,
          starRating: parsed.star_rating,
          reviewText: parsed.review_text,
          dashboardUrl: `${appUrl}/dashboard`,
        }).catch((err) => console.error('Email send failed:', err))
      }

      // Skip reply generation for reviews that already have replies
      if (parsed.has_existing_reply) continue

      // AI replies require active trial or pro
      if (!userCanAI) continue

      // Generate AI reply
      try {
        const replyText = await generateReviewReply({
          userId: user.id,
          businessName: profile.business_name || 'Our Business',
          businessLocation: profile.business_location || '',
          tonePreference: profile.tone_preference || 'friendly and professional',
          customInstructions: profile.custom_instructions,
          starRating: parsed.star_rating,
          reviewText: parsed.review_text,
          reviewerName: parsed.reviewer_name,
        })

        // Save reply
        await adminClient.from('replies').insert({
          review_id: savedReview.id,
          generated_text: replyText,
          final_text: replyText,
          status: 'pending',
        })

        // Update review status
        await adminClient
          .from('reviews')
          .update({ status: 'reply_generated' })
          .eq('id', savedReview.id)

        // Log reply generation
        await adminClient.from('activity_log').insert({
          user_id: user.id,
          action: 'reply_generated',
          review_id: savedReview.id,
          details: `AI reply generated for ${parsed.reviewer_name}'s review`,
        })

        // Smart auto-publish: check if this star rating is in the auto-publish list
        const autoPublishStars: number[] = Array.isArray(profile.auto_publish_stars)
          ? profile.auto_publish_stars
          : [4, 5]
        const shouldAutoPublish = userCanAutoPublish && autoPublishStars.includes(parsed.star_rating)

        if (shouldAutoPublish) {
          try {
            await postReply(
              user.id,
              profile.google_account_id,
              profile.google_location_id,
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
              details: `Reply auto-published for ${parsed.reviewer_name}'s review`,
            })
          } catch (publishError) {
            console.error('Auto-publish failed:', publishError)
            await adminClient
              .from('replies')
              .update({ status: 'approved' })
              .eq('review_id', savedReview.id)

            await adminClient
              .from('reviews')
              .update({ status: 'approved' })
              .eq('id', savedReview.id)
          }
        }
      } catch (aiError) {
        console.error('AI reply generation failed:', aiError)
        // Retry once
        try {
          const replyText = await generateReviewReply({
            userId: user.id,
            businessName: profile.business_name || 'Our Business',
            businessLocation: profile.business_location || '',
            tonePreference: profile.tone_preference || 'friendly and professional',
            customInstructions: profile.custom_instructions,
            starRating: parsed.star_rating,
            reviewText: parsed.review_text,
            reviewerName: parsed.reviewer_name,
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
        } catch {
          errors.push(`AI failed for review ${parsed.google_review_id}`)
        }
      }
    }

    return NextResponse.json({
      message: `Found ${newReviewCount} new review(s)`,
      new_reviews: newReviewCount,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('Review refresh error:', error)
    return NextResponse.json(
      { error: 'Failed to refresh reviews' },
      { status: 500 }
    )
  }
}
