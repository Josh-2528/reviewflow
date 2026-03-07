import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buildAIPrompt, logApiUsage } from '@/lib/claude'

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

// POST /api/admin/ai-prompts/preview — generate test replies
export async function POST(request: NextRequest) {
  try {
    const admin = await verifyAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    const { settings, businessName, businessLocation } = body

    // Import Anthropic here to keep it server-only
    const Anthropic = (await import('@anthropic-ai/sdk')).default
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    })

    // Fake 1-star review
    const prompt1Star = buildAIPrompt({
      globalSettings: null,
      customerSettings: settings,
      businessName: businessName || 'Sample Car Wash',
      businessLocation: businessLocation || 'Melbourne, Australia',
      starRating: 1,
      reviewerName: 'Frustrated Customer',
      reviewText: 'Terrible experience. The machine ate my $20 note and nobody was around to help. Waited 30 minutes in the rain. Absolutely shocking service.',
    })

    // Fake 5-star review
    const prompt5Star = buildAIPrompt({
      globalSettings: null,
      customerSettings: settings,
      businessName: businessName || 'Sample Car Wash',
      businessLocation: businessLocation || 'Melbourne, Australia',
      starRating: 5,
      reviewerName: 'Happy Customer',
      reviewText: 'Best car wash in the area! Got the full detail package and my car has never looked this good. The staff were super friendly too. Will definitely be back!',
    })

    // Generate both replies
    const [reply1Star, reply5Star] = await Promise.all([
      anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 300,
        system: prompt1Star.system,
        messages: [{ role: 'user', content: prompt1Star.user }],
      }),
      anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 300,
        system: prompt5Star.system,
        messages: [{ role: 'user', content: prompt5Star.user }],
      }),
    ])

    // Log usage for both preview calls (fire-and-forget)
    logApiUsage({
      userId: admin.id,
      action: 'preview',
      inputTokens: reply1Star.usage.input_tokens,
      outputTokens: reply1Star.usage.output_tokens,
    })
    logApiUsage({
      userId: admin.id,
      action: 'preview',
      inputTokens: reply5Star.usage.input_tokens,
      outputTokens: reply5Star.usage.output_tokens,
    })

    const text1 = reply1Star.content.find((b) => b.type === 'text')
    const text5 = reply5Star.content.find((b) => b.type === 'text')

    return NextResponse.json({
      oneStarReply: text1?.type === 'text' ? text1.text.trim() : 'Failed to generate',
      fiveStarReply: text5?.type === 'text' ? text5.text.trim() : 'Failed to generate',
    })
  } catch (error) {
    console.error('AI preview error:', error)
    return NextResponse.json({ error: 'Failed to generate preview' }, { status: 500 })
  }
}
