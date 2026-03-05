import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateReviewReply } from '@/lib/claude'
import { postReply } from '@/lib/google'
import { hasFullAccess, canAutoPublish } from '@/lib/stripe'
import { sendNewReviewEmail } from '@/lib/email'

async function verifyAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null
  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail || user.email !== adminEmail) return null
  return user
}

// POST /api/admin/test-review — inject a test review and run the full pipeline
export async function POST(request: NextRequest) {
  try {
    const admin = await verifyAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    const { user_id, reviewer_name, star_rating, review_text, location_id } = body

    if (!user_id || !reviewer_name || !star_rating) {
      return NextResponse.json(
        { error: 'user_id, reviewer_name, and star_rating are required' },
        { status: 400 }
      )
    }

    if (star_rating < 1 || star_rating > 5) {
      return NextResponse.json(
        { error: 'star_rating must be between 1 and 5' },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()

    // Get user profile
    const { data: profile, error: profileError } = await adminClient
      .from('users')
      .select('*')
      .eq('id', user_id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Generate a unique fake google_review_id
    const testReviewId = `test_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

    // 1. Insert the test review
    const { data: savedReview, error: saveError } = await adminClient
      .from('reviews')
      .insert({
        user_id,
        location_id: location_id || null,
        google_review_id: testReviewId,
        reviewer_name,
        reviewer_photo_url: null,
        star_rating,
        review_text: review_text || null,
        review_created_at: new Date().toISOString(),
        has_existing_reply: false,
        status: 'new',
        test_review: true,
      })
      .select()
      .single()

    if (saveError || !savedReview) {
      console.error('Failed to insert test review:', saveError)
      return NextResponse.json({ error: 'Failed to create test review' }, { status: 500 })
    }

    // 2. Log review detection
    await adminClient.from('activity_log').insert({
      user_id,
      action: 'review_detected',
      review_id: savedReview.id,
      location_id: location_id || null,
      details: `[TEST] New ${star_rating}-star review from ${reviewer_name}`,
    })

    // 2b. Send email notification (same logic as review refresh route)
    let locationName: string | null = null
    let locationContactEmail: string | null = null
    if (location_id) {
      const { data: location } = await adminClient
        .from('locations')
        .select('location_name, contact_email')
        .eq('id', location_id)
        .single()
      if (location) {
        locationName = location.location_name
        locationContactEmail = location.contact_email
      }
    }
    const emailTo = locationContactEmail || (profile.email_new_review !== false ? profile.email : null)
    if (emailTo) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      sendNewReviewEmail({
        to: emailTo,
        businessName: profile.business_name || 'Your Business',
        locationName,
        reviewerName: reviewer_name,
        starRating: star_rating,
        reviewText: review_text || null,
        dashboardUrl: `${appUrl}/dashboard`,
      }).catch((err) => console.error('[TEST] Email send failed:', err))
    }

    // 3. Generate AI reply (using the customer's full AI prompt settings)
    let replyText: string
    try {
      replyText = await generateReviewReply({
        userId: user_id,
        businessName: profile.business_name || 'Our Business',
        businessLocation: profile.business_location || '',
        tonePreference: profile.tone_preference || 'friendly and professional',
        customInstructions: profile.custom_instructions,
        starRating: star_rating,
        reviewText: review_text || null,
        reviewerName: reviewer_name,
        locationId: location_id || null,
      })
    } catch (aiError) {
      console.error('AI reply generation failed for test review:', aiError)
      return NextResponse.json({
        message: 'Test review created but AI reply generation failed',
        review_id: savedReview.id,
        error: 'AI generation failed',
      })
    }

    // 4. Save the reply
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
      user_id,
      action: 'reply_generated',
      review_id: savedReview.id,
      location_id: location_id || null,
      details: `[TEST] AI reply generated for ${reviewer_name}'s review`,
    })

    // 5. Check auto-publish stars
    const autoPublishStars: number[] = Array.isArray(profile.auto_publish_stars)
      ? profile.auto_publish_stars
      : [4, 5]
    const userCanPublish = hasFullAccess(profile) && canAutoPublish(profile)
    const shouldAutoPublish = userCanPublish && autoPublishStars.includes(star_rating)

    let finalStatus = 'reply_generated'

    if (shouldAutoPublish) {
      // For test reviews, we auto-publish to Google only if the user has a connected Google account
      if (profile.google_connected && profile.google_account_id && profile.google_location_id) {
        try {
          await postReply(
            user_id,
            profile.google_account_id,
            profile.google_location_id,
            testReviewId,
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
            user_id,
            action: 'reply_published',
            review_id: savedReview.id,
            location_id: location_id || null,
            details: `[TEST] Reply auto-published for ${reviewer_name}'s review`,
          })

          finalStatus = 'published'
        } catch (publishErr) {
          console.error('Test review auto-publish failed:', publishErr)
          // Google will reject fake review IDs — mark as would-have-auto-published
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

          finalStatus = 'published (Google post skipped — test review)'
        }
      } else {
        // No Google connected — simulate auto-publish locally
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
          user_id,
          action: 'reply_published',
          review_id: savedReview.id,
          location_id: location_id || null,
          details: `[TEST] Reply auto-published (no Google connected) for ${reviewer_name}'s review`,
        })

        finalStatus = 'published (auto-publish simulated)'
      }
    }

    return NextResponse.json({
      message: 'Test review created and processed',
      review_id: savedReview.id,
      status: finalStatus,
      auto_publish_triggered: shouldAutoPublish,
      reply_preview: replyText.substring(0, 200) + (replyText.length > 200 ? '...' : ''),
    })
  } catch (error) {
    console.error('Test review error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
