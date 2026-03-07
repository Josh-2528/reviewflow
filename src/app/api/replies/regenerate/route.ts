import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateReviewReply } from '@/lib/claude'
import { hasFullAccess } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { review_id } = await request.json()

    if (!review_id) {
      return NextResponse.json(
        { error: 'review_id is required' },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()

    // Get user profile
    const { data: profile } = await adminClient
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!hasFullAccess(profile)) {
      return NextResponse.json(
        { error: 'Your trial has ended. Subscribe to continue managing your reviews.' },
        { status: 403 }
      )
    }

    // Get review
    const { data: review } = await adminClient
      .from('reviews')
      .select('*')
      .eq('id', review_id)
      .eq('user_id', user.id)
      .single()

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    // Generate a fresh AI reply
    const replyText = await generateReviewReply({
      userId: user.id,
      businessName: profile.business_name || 'Our Business',
      businessLocation: profile.business_location || '',
      tonePreference: profile.tone_preference || 'friendly and professional',
      customInstructions: profile.custom_instructions,
      starRating: review.star_rating,
      reviewText: review.review_text,
      reviewerName: review.reviewer_name,
      locationId: review.location_id,
      action: 'reply_regeneration',
    })

    // Update existing reply or insert new one
    const { data: existingReply } = await adminClient
      .from('replies')
      .select('id')
      .eq('review_id', review_id)
      .single()

    if (existingReply) {
      await adminClient
        .from('replies')
        .update({
          generated_text: replyText,
          edited_text: null,
          final_text: replyText,
          status: 'pending',
        })
        .eq('id', existingReply.id)
    } else {
      await adminClient.from('replies').insert({
        review_id,
        generated_text: replyText,
        final_text: replyText,
        status: 'pending',
      })
    }

    // Reset review status to reply_generated
    await adminClient
      .from('reviews')
      .update({ status: 'reply_generated' })
      .eq('id', review_id)

    // Log activity
    await adminClient.from('activity_log').insert({
      user_id: user.id,
      action: 'reply_generated',
      review_id,
      location_id: review.location_id,
      details: `AI reply regenerated for ${review.reviewer_name}'s review`,
    })

    return NextResponse.json({ message: 'Reply regenerated', reply_text: replyText })
  } catch (error) {
    console.error('Regenerate error:', error)
    return NextResponse.json(
      { error: 'Failed to regenerate reply' },
      { status: 500 }
    )
  }
}
