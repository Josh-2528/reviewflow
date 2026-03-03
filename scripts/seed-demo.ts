// Demo seed script for ReviewFlow
// Populates the database with 15 fake reviews for "Sparkle & Shine Car Wash"
//
// Usage:
//   npx tsx scripts/seed-demo.ts
//
// Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { randomUUID } from 'crypto'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const DEMO_EMAIL = 'demo@reviewflow.app'
const DEMO_PASSWORD = 'demo-reviewflow-2026'

// ── Review seed data ────────────────────────────────────────────────

interface SeedReview {
  reviewer_name: string
  star_rating: number
  review_text: string | null
  status: 'reply_generated' | 'published' | 'skipped' | 'new'
  reply_text: string
  days_ago: number
}

const reviews: SeedReview[] = [
  {
    reviewer_name: 'Marcus Thompson',
    star_rating: 5,
    review_text:
      'Best car wash in town, hands down. Got the full detail package and my 10-year-old Camry looks brand new. The interior vacuum job was incredible — they even got crumbs out of the seat tracks. Will be back every month.',
    status: 'published',
    reply_text:
      'Marcus, really glad you went with the full detail — a Camry that clean deserves to be shown off. See you next month, we\'ll keep it looking fresh.',
    days_ago: 2,
  },
  {
    reviewer_name: 'Jenny Liu',
    star_rating: 4,
    review_text:
      'Good wash overall. My SUV came out sparkling and the guys were friendly. Took about 45 minutes which was a bit longer than expected. Would have been 5 stars if the wait was shorter.',
    status: 'published',
    reply_text:
      'Thanks Jenny. 45 minutes is a bit longer than our usual — we\'re working on speeding up SUV turnaround without cutting corners. Appreciate the feedback and glad it came out sparkling.',
    days_ago: 3,
  },
  {
    reviewer_name: 'Dave Richards',
    star_rating: 1,
    review_text:
      'Extremely disappointed. I paid for the premium wash and there were still water spots all over the hood and roof. When I pointed it out, the staff just shrugged. Won\'t be coming back.',
    status: 'reply_generated',
    reply_text:
      'Dave, that\'s not the standard we hold ourselves to and I\'m sorry you experienced that. Water spots after a premium wash is unacceptable. I\'d like to make this right — please give us a call at (03) 9555 0123 and ask for the manager.',
    days_ago: 1,
  },
  {
    reviewer_name: 'Sarah Nguyen',
    star_rating: 5,
    review_text:
      'I bring both my cars here fortnightly. Consistent quality every single time. The express wash is great value and my white car always looks showroom-ready after. Love the loyalty card too!',
    status: 'published',
    reply_text:
      'Sarah, fortnightly regulars like you are the reason we keep our standards high. White cars show everything so we take that as a compliment. Enjoy the loyalty rewards!',
    days_ago: 5,
  },
  {
    reviewer_name: 'Tom Bradley',
    star_rating: 3,
    review_text:
      'It was fine. Nothing special but nothing bad either. Standard exterior wash, got the job done. Pricing is about average for the area.',
    status: 'reply_generated',
    reply_text:
      'Thanks for the honest feedback, Tom. If you ever want to try the full detail, we think you\'ll notice the difference. Hope to see you again.',
    days_ago: 4,
  },
  {
    reviewer_name: 'Rachel Kim',
    star_rating: 5,
    review_text:
      'OMG they got a coffee stain out of my passenger seat that I thought was permanent! The interior detail service is worth every cent. The team was so careful with my leather seats too.',
    status: 'published',
    reply_text:
      'Rachel, coffee stains on upholstery are one of our favourite challenges. Glad we could rescue that passenger seat — leather seats need the right touch and our team takes pride in that.',
    days_ago: 7,
  },
  {
    reviewer_name: 'James O\'Connor',
    star_rating: 2,
    review_text:
      'Waited 20 minutes past my appointment time before they even started. The wash itself was decent but the disorganisation at the front desk was frustrating. They need better scheduling.',
    status: 'reply_generated',
    reply_text:
      'James, a 20-minute wait past your appointment isn\'t good enough and I apologise. We\'ve been tightening up our scheduling system this week. Would genuinely appreciate another chance — call us on (03) 9555 0123 to book and we\'ll make sure you\'re seen on time.',
    days_ago: 6,
  },
  {
    reviewer_name: 'Priya Patel',
    star_rating: 5,
    review_text: null,
    status: 'published',
    reply_text:
      'Thanks for the 5 stars, Priya! If there\'s anything specific you loved, we\'d love to hear about it.',
    days_ago: 8,
  },
  {
    reviewer_name: 'Mike Stevenson',
    star_rating: 4,
    review_text:
      'Solid car wash with good attention to detail. They cleaned my wheel arches and door jambs without me even asking. Only reason it\'s not 5 stars is the car air freshener they used was way too strong.',
    status: 'published',
    reply_text:
      'Mike, glad you noticed the wheel arches and door jambs — that\'s standard for us. Good note on the air freshener though, we can dial that back or skip it entirely. Just let us know next visit.',
    days_ago: 10,
  },
  {
    reviewer_name: 'Linda Gao',
    star_rating: 1,
    review_text:
      'Found a new scratch on my driver side door after the wash. I know it wasn\'t there before. Staff said it must have been pre-existing. Very unhappy with how this was handled.',
    status: 'new',
    reply_text:
      'Linda, I take scratch reports very seriously. I\'d like to review our camera footage with you and sort this out properly. Please contact me directly at (03) 9555 0123 — ask for Steve, the owner. We\'ll make it right.',
    days_ago: 0,
  },
  {
    reviewer_name: 'Chris Walker',
    star_rating: 5,
    review_text:
      'Brought my motorbike in for a hand wash and they treated it like it was their own. Careful around all the chrome, dried it properly, no water in the electrics. These guys know what they\'re doing.',
    status: 'published',
    reply_text:
      'Chris, motorbikes need a completely different approach and our team loves working on them. Glad we kept that chrome spotless. Ride safe!',
    days_ago: 12,
  },
  {
    reviewer_name: 'Amanda Foster',
    star_rating: 3,
    review_text: null,
    status: 'skipped',
    reply_text:
      'Hi Amanda, thanks for visiting! We\'d love to know what we could do better to earn that 4th and 5th star.',
    days_ago: 15,
  },
  {
    reviewer_name: 'Daniel Russo',
    star_rating: 4,
    review_text:
      'Great express wash for the price. In and out in 15 minutes and my black car looked great. The hand dry at the end makes a real difference compared to those automated blower places.',
    status: 'published',
    reply_text:
      'Daniel, hand drying a black car is the only way to do it properly — automated blowers always leave streaks. Glad you noticed the difference. 15 minutes is about our target for express, too.',
    days_ago: 18,
  },
  {
    reviewer_name: 'Olivia Chen',
    star_rating: 5,
    review_text:
      'I\'m a real estate agent so my car is basically my office. Sparkle & Shine keeps it looking professional every week. The monthly membership is great value and I never have to think about booking.',
    status: 'published',
    reply_text:
      'Olivia, first impressions matter in real estate and we\'re happy to help you make a good one. The membership was designed for exactly this — one less thing to think about. See you next week!',
    days_ago: 22,
  },
  {
    reviewer_name: 'Ben Kowalski',
    star_rating: 2,
    review_text:
      'The exterior wash was OK but I specifically asked for tyre shine and it wasn\'t done. When I went back to ask they did it but seemed annoyed. Customer service could use improvement.',
    status: 'reply_generated',
    reply_text:
      'Ben, if you asked for tyre shine and it was missed, that\'s on us — and you shouldn\'t have to feel awkward asking for what you paid for. I\'ve spoken to the team about this. Next visit is on us, just mention this review at the counter.',
    days_ago: 25,
  },
]

// ── Main seed function ──────────────────────────────────────────────

async function seed() {
  console.log('🌱 Starting demo seed...\n')

  // 1. Create or find demo auth user
  console.log('👤 Setting up demo user...')

  let demoUserId: string

  // Try to find existing demo user
  const { data: existingUsers } = await supabase.auth.admin.listUsers()
  const existingDemo = existingUsers?.users?.find((u) => u.email === DEMO_EMAIL)

  if (existingDemo) {
    demoUserId = existingDemo.id
    console.log(`   Found existing demo user: ${demoUserId}`)
  } else {
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      email_confirm: true,
    })

    if (createError || !newUser?.user) {
      console.error('Failed to create demo user:', createError)
      process.exit(1)
    }

    demoUserId = newUser.user.id
    console.log(`   Created demo user: ${demoUserId}`)
  }

  // 2. Upsert user profile
  console.log('🏢 Setting up business profile...')

  const { error: profileError } = await supabase.from('users').upsert(
    {
      id: demoUserId,
      email: DEMO_EMAIL,
      business_name: 'Sparkle & Shine Car Wash',
      business_location: 'Melbourne, Australia',
      tone_preference: 'friendly and professional',
      custom_instructions: 'Always invite unhappy customers to call us on (03) 9555 0123. Mention our loyalty card when appropriate.',
      auto_publish: false,
      onboarding_completed: true,
      google_connected: false,
    },
    { onConflict: 'id' }
  )

  if (profileError) {
    console.error('Failed to upsert profile:', profileError)
    process.exit(1)
  }

  // 3. Clear existing demo data
  console.log('🧹 Clearing old demo data...')

  await supabase.from('activity_log').delete().eq('user_id', demoUserId)
  // Delete replies via reviews (cascade should handle it, but let's be explicit)
  const { data: oldReviews } = await supabase
    .from('reviews')
    .select('id')
    .eq('user_id', demoUserId)
  if (oldReviews && oldReviews.length > 0) {
    const oldIds = oldReviews.map((r) => r.id)
    await supabase.from('replies').delete().in('review_id', oldIds)
  }
  await supabase.from('reviews').delete().eq('user_id', demoUserId)

  // 4. Insert reviews and replies
  console.log('⭐ Seeding 15 reviews...\n')

  const now = new Date()

  for (const review of reviews) {
    const reviewDate = new Date(now)
    reviewDate.setDate(reviewDate.getDate() - review.days_ago)
    // Randomize time of day
    reviewDate.setHours(Math.floor(Math.random() * 14) + 8) // 8am - 10pm
    reviewDate.setMinutes(Math.floor(Math.random() * 60))

    const reviewId = randomUUID()
    const replyCreatedAt = new Date(reviewDate)
    replyCreatedAt.setMinutes(replyCreatedAt.getMinutes() + Math.floor(Math.random() * 10) + 2)

    const { error: reviewError } = await supabase.from('reviews').insert({
      id: reviewId,
      user_id: demoUserId,
      google_review_id: `demo_review_${randomUUID().slice(0, 8)}`,
      reviewer_name: review.reviewer_name,
      reviewer_photo_url: null,
      star_rating: review.star_rating,
      review_text: review.review_text,
      review_created_at: reviewDate.toISOString(),
      has_existing_reply: review.status === 'published',
      status: review.status,
      created_at: reviewDate.toISOString(),
    })

    if (reviewError) {
      console.error(`   ❌ Failed to insert review from ${review.reviewer_name}:`, reviewError.message)
      continue
    }

    // Determine reply status based on review status
    let replyStatus: string
    let publishedAt: string | null = null

    switch (review.status) {
      case 'published':
        replyStatus = 'published'
        const pubDate = new Date(replyCreatedAt)
        pubDate.setMinutes(pubDate.getMinutes() + Math.floor(Math.random() * 30) + 5)
        publishedAt = pubDate.toISOString()
        break
      case 'reply_generated':
        replyStatus = 'pending'
        break
      case 'skipped':
        replyStatus = 'rejected'
        break
      case 'new':
        replyStatus = 'pending'
        break
      default:
        replyStatus = 'pending'
    }

    const { error: replyError } = await supabase.from('replies').insert({
      review_id: reviewId,
      generated_text: review.reply_text,
      final_text: review.reply_text,
      status: replyStatus,
      published_at: publishedAt,
      created_at: replyCreatedAt.toISOString(),
    })

    if (replyError) {
      console.error(`   ❌ Failed to insert reply for ${review.reviewer_name}:`, replyError.message)
      continue
    }

    const stars = '★'.repeat(review.star_rating) + '☆'.repeat(5 - review.star_rating)
    console.log(`   ${stars}  ${review.reviewer_name.padEnd(20)} → ${review.status}`)

    // 5. Insert activity log entries
    await supabase.from('activity_log').insert({
      user_id: demoUserId,
      action: 'review_detected',
      review_id: reviewId,
      details: `New ${review.star_rating}-star review from ${review.reviewer_name}`,
      created_at: reviewDate.toISOString(),
    })

    await supabase.from('activity_log').insert({
      user_id: demoUserId,
      action: 'reply_generated',
      review_id: reviewId,
      details: `AI reply generated for ${review.reviewer_name}'s review`,
      created_at: replyCreatedAt.toISOString(),
    })

    if (review.status === 'published') {
      await supabase.from('activity_log').insert({
        user_id: demoUserId,
        action: 'reply_published',
        review_id: reviewId,
        details: `Reply published for ${review.reviewer_name}'s review`,
        created_at: publishedAt!,
      })
    }
  }

  console.log('\n✅ Demo seed complete!')
  console.log(`\n   Demo login:  ${DEMO_EMAIL}`)
  console.log(`   Password:    ${DEMO_PASSWORD}`)
  console.log(`   Business:    Sparkle & Shine Car Wash, Melbourne\n`)
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
