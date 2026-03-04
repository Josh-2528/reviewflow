import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { postReply } from '@/lib/google'
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

    // Check if user has access
    if (!hasFullAccess(profile)) {
      return NextResponse.json(
        { error: 'Your trial has ended. Subscribe to continue managing your reviews.' },
        { status: 403 }
      )
    }

    // Get review and reply
    const { data: review } = await adminClient
      .from('reviews')
      .select('*, reply:replies(*)')
      .eq('id', review_id)
      .eq('user_id', user.id)
      .single()

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    const reply = Array.isArray(review.reply) ? review.reply[0] : review.reply
    if (!reply) {
      return NextResponse.json({ error: 'No reply found for this review' }, { status: 404 })
    }

    // Post reply to Google
    try {
      if (profile.google_connected && profile.google_account_id && profile.google_location_id) {
        await postReply(
          user.id,
          profile.google_account_id,
          profile.google_location_id,
          review.google_review_id,
          reply.final_text
        )
      }
    } catch (googleError) {
      console.error('Google post failed:', googleError)
      await adminClient
        .from('replies')
        .update({ status: 'approved' })
        .eq('id', reply.id)

      await adminClient
        .from('reviews')
        .update({ status: 'approved' })
        .eq('id', review_id)

      return NextResponse.json(
        { error: 'Reply approved but failed to publish to Google. You can retry later.' },
        { status: 502 }
      )
    }

    // Update reply status
    await adminClient
      .from('replies')
      .update({
        status: 'published',
        published_at: new Date().toISOString(),
      })
      .eq('id', reply.id)

    // Update review status
    await adminClient
      .from('reviews')
      .update({ status: 'published' })
      .eq('id', review_id)

    // Log activity
    await adminClient.from('activity_log').insert({
      user_id: user.id,
      action: 'reply_approved',
      review_id: review_id,
      details: `Reply approved and published for ${review.reviewer_name}'s review`,
    })

    await adminClient.from('activity_log').insert({
      user_id: user.id,
      action: 'reply_published',
      review_id: review_id,
      details: `Reply published for ${review.reviewer_name}'s review`,
    })

    return NextResponse.json({ message: 'Reply approved and published' })
  } catch (error) {
    console.error('Approve error:', error)
    return NextResponse.json(
      { error: 'Failed to approve reply' },
      { status: 500 }
    )
  }
}
