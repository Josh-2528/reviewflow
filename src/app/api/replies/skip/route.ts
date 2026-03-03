import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

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

    // Verify review belongs to user
    const { data: review } = await adminClient
      .from('reviews')
      .select('*, reply:replies(*)')
      .eq('id', review_id)
      .eq('user_id', user.id)
      .single()

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    // Update review status
    await adminClient
      .from('reviews')
      .update({ status: 'skipped' })
      .eq('id', review_id)

    // Update reply status if exists
    const reply = Array.isArray(review.reply) ? review.reply[0] : review.reply
    if (reply) {
      await adminClient
        .from('replies')
        .update({ status: 'rejected' })
        .eq('id', reply.id)
    }

    // Log activity
    await adminClient.from('activity_log').insert({
      user_id: user.id,
      action: 'reply_rejected',
      review_id: review_id,
      details: `Reply skipped for ${review.reviewer_name}'s review`,
    })

    return NextResponse.json({ message: 'Review skipped' })
  } catch (error) {
    console.error('Skip error:', error)
    return NextResponse.json(
      { error: 'Failed to skip review' },
      { status: 500 }
    )
  }
}
