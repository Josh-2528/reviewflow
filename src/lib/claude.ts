import Anthropic from '@anthropic-ai/sdk'
import { createAdminClient } from '@/lib/supabase/admin'
import type { AIPromptSettings } from '@/lib/types'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

// ── Default prompts (used when no DB settings exist) ────────────────

const DEFAULT_BASE_PROMPT = `You write Google Review replies as a car wash owner — not a brand, not a chatbot, not a PR team. A real person who runs the place.

VOICE:
- Conversational, confident, genuine. Like you read the review on your phone and replied between jobs.
- Proud of your team. When things go right, credit them. When things go wrong, own it.
- Short. Most replies are 2-4 sentences. A "Great wash!" doesn't need an essay.

NEVER:
- Invent operational details, promises, or fixes not in the business context or custom instructions. If you don't know it, don't claim it. Acknowledge the issue and direct them to get in touch.
- Open with "Thank you for your feedback," "We appreciate you taking the time," or "I'm sorry to hear that" — instant bot tells.
- Use: "valued customer," "your patronage," "we strive to," "we pride ourselves on," "rest assured," "Dear [Name]"
- Use the word "feedback" or "experience" (once max, ideally zero)
- Repeat the reviewer's words back to them
- End with "We look forward to seeing you again!" or any variant
- Use more than one exclamation mark per reply
- Use emojis (unless reviewer did, then max one), hashtags, bullet points, or numbered lists
- Use placeholders, brackets, or notes. Every reply must be publish-ready.

ALWAYS:
- Use their first name if available. If not, skip it — don't use "Hi there" or "Dear customer."
- Reference something specific from their review (without quoting them)
- Match the review's energy — quick reviews get quick replies, detailed ones get more thought
- Sound like you could say it out loud to someone at the counter
- Only include contact details if provided in the configuration below. Only use the sign-off if provided below.`

const DEFAULT_STAR_INSTRUCTIONS: Record<number, string> = {
  1: `Most important reply you'll write. The next 50 people will read this to judge you. 3-5 sentences. Don't open with an apology — open with acknowledgment ("That's not good enough, [Name]"). Address the specific complaint. Take responsibility where it's warranted. Offer a concrete next step and include contact info. Stay calm and confident. CRITICAL: Only mention what the reviewer actually wrote.`,
  2: `Bad time. Respect it. Don't get defensive or explain it away. 3-5 sentences. Acknowledge what went wrong, say what you can do about it, include contact details so they can reach out directly. CRITICAL: Only mention what the reviewer actually wrote.`,
  3: `On the fence — this reply can tip them toward coming back or writing you off. 3-4 sentences. Address their issue directly and honestly. "Yeah, that's not the standard we're going for" beats "We sincerely apologize for falling short." Invite them to reach out if appropriate. CRITICAL: Only mention what the reviewer actually wrote.`,
  4: `Happy but something wasn't perfect. Don't panic or overcompensate. 2-3 sentences. If they mentioned what held back the 5th star, acknowledge it briefly. If not, don't go fishing. Never say "sorry we didn't earn that 5th star." CRITICAL: Only mention what the reviewer actually wrote.`,
  5: `They're happy. Keep it short and real — 1-2 sentences, 3 max. Vary your openers: "[Name], legend." / "Appreciate that, [Name]." / "Nice one — team will be stoked to hear this." / "That's what we like to hear." If they mentioned something specific, acknowledge it briefly. If not, don't invent things to talk about. CRITICAL: Only mention what the reviewer actually wrote.`,
}

// ── Prompt builder (exported for preview endpoint) ──────────────────

interface BuildPromptParams {
  globalSettings: AIPromptSettings | null
  customerSettings: AIPromptSettings | null
  businessName: string
  businessLocation: string
  starRating: number
  reviewerName: string
  reviewText: string | null
}

export function buildAIPrompt(params: BuildPromptParams): {
  system: string
  user: string
} {
  const {
    globalSettings,
    customerSettings,
    businessName,
    businessLocation,
    starRating,
    reviewerName,
    reviewText,
  } = params

  // Helper: pick customer override if non-empty, else global, else default
  const pick = (
    customerField: string | null | undefined,
    globalField: string | null | undefined,
    fallback: string
  ): string => {
    if (customerField && customerField.trim()) return customerField.trim()
    if (globalField && globalField.trim()) return globalField.trim()
    return fallback
  }

  // 1. Base system prompt
  const basePrompt = pick(
    customerSettings?.base_system_prompt,
    globalSettings?.base_system_prompt,
    DEFAULT_BASE_PROMPT
  )

  // 2. Star-rating instructions
  const starKey = `star_${starRating}_instructions` as keyof AIPromptSettings
  const starInstructions = pick(
    customerSettings?.[starKey] as string | null,
    globalSettings?.[starKey] as string | null,
    DEFAULT_STAR_INSTRUCTIONS[starRating] || ''
  )

  // 3. Build system prompt with all layers
  const systemParts: string[] = [basePrompt]

  // Star rating instructions
  if (starInstructions) {
    systemParts.push(`\nFor this ${starRating}-star review:\n${starInstructions}`)
  }

  // Business context
  const businessContext = customerSettings?.business_context?.trim()
  if (businessContext) {
    systemParts.push(`\nBusiness context:\n${businessContext}`)
  }

  // Custom instructions
  const customInstructions = customerSettings?.custom_instructions?.trim()
  if (customInstructions) {
    systemParts.push(`\nSpecific rules:\n${customInstructions}`)
  }

  // Contact details
  const contactEmail = customerSettings?.contact_email?.trim()
  const contactPhone = customerSettings?.contact_phone?.trim()
  const contactStyle = customerSettings?.contact_reference_style?.trim() || 'email us at'
  const contactInclude = customerSettings?.contact_include_on || 'negative_only'

  const shouldIncludeContact =
    (contactEmail || contactPhone) &&
    (contactInclude === 'always' ||
      (contactInclude === 'negative_only' && starRating <= 3))

  if (shouldIncludeContact) {
    const contactParts: string[] = []
    if (contactEmail) contactParts.push(`${contactStyle} ${contactEmail}`)
    if (contactPhone) contactParts.push(`call on ${contactPhone}`)

    systemParts.push(
      `\nWhen inviting the reviewer to get in touch, tell them to ${contactParts.join(' or ')}.`
    )
  }

  // Tone
  const tone = customerSettings?.tone?.trim() || globalSettings?.tone?.trim() || 'friendly'
  if (tone === 'custom' && customerSettings?.custom_tone_description?.trim()) {
    systemParts.push(`\nTone: ${customerSettings.custom_tone_description.trim()}`)
  } else if (tone && tone !== 'friendly') {
    const toneMap: Record<string, string> = {
      professional: 'professional and warm',
      formal: 'formal and corporate',
      custom: 'friendly',
    }
    systemParts.push(`\nTone: Write in a ${toneMap[tone] || tone} tone.`)
  }

  // Sign-off
  const signOff = customerSettings?.sign_off?.trim()
  if (signOff) {
    systemParts.push(`\nEnd the reply with: ${signOff}`)
  }

  // Do not mention
  const doNotMention = customerSettings?.do_not_mention?.trim()
  if (doNotMention) {
    systemParts.push(`\nNEVER mention or reference any of the following:\n${doNotMention}`)
  }

  // Always mention
  const alwaysMention = customerSettings?.always_mention?.trim()
  if (alwaysMention) {
    systemParts.push(`\nWhen relevant, try to include:\n${alwaysMention}`)
  }

  const system = systemParts.join('\n')

  // 4. Build user message
  const reviewContent = reviewText
    ? `${starRating} stars\n\n"${reviewText}"`
    : `${starRating} stars (no text provided)`

  const user = `Business: ${businessName} in ${businessLocation}
Reviewer: ${reviewerName}

Review: ${reviewContent}

Write a reply in 1-3 sentences.${
    !reviewText
      ? starRating >= 4
        ? ' Since there is no review text, write a brief thank you.'
        : ' Since there is no review text, write a brief "we\'d love to hear more about your experience" message.'
      : ''
  }`

  return { system, user }
}

// ── Fetch AI settings from DB ───────────────────────────────────────

async function getAISettings(
  userId: string,
  locationId?: string | null
): Promise<{
  global: AIPromptSettings | null
  customer: AIPromptSettings | null
}> {
  const adminClient = createAdminClient()

  // Fetch global settings
  const globalPromise = adminClient
    .from('ai_prompt_settings')
    .select('*')
    .is('user_id', null)
    .single()

  // Fetch customer settings - prefer location-specific, fall back to user-level
  let customerPromise
  if (locationId) {
    // Try location-specific first
    customerPromise = adminClient
      .from('ai_prompt_settings')
      .select('*')
      .eq('user_id', userId)
      .eq('location_id', locationId)
      .single()
  } else {
    customerPromise = adminClient
      .from('ai_prompt_settings')
      .select('*')
      .eq('user_id', userId)
      .is('location_id', null)
      .single()
  }

  const [globalResult, customerResult] = await Promise.all([
    globalPromise,
    customerPromise,
  ])

  let customer = customerResult.data || null

  // If we searched for location-specific and found nothing, fall back to user-level
  if (!customer && locationId) {
    const { data: userLevel } = await adminClient
      .from('ai_prompt_settings')
      .select('*')
      .eq('user_id', userId)
      .is('location_id', null)
      .single()
    customer = userLevel || null
  }

  return {
    global: globalResult.data || null,
    customer,
  }
}

// ── Main reply generation function ──────────────────────────────────

interface GenerateReplyParams {
  userId: string
  businessName: string
  businessLocation: string
  tonePreference: string
  customInstructions: string | null
  starRating: number
  reviewText: string | null
  reviewerName?: string
  locationId?: string | null
}

export async function generateReviewReply(
  params: GenerateReplyParams
): Promise<string> {
  const {
    userId,
    businessName,
    businessLocation,
    tonePreference,
    customInstructions,
    starRating,
    reviewText,
    reviewerName,
    locationId,
  } = params

  // Fetch AI settings from DB
  const { global: globalSettings, customer: customerSettings } =
    await getAISettings(userId, locationId)

  // If the customer has user-facing tone/instructions but no ai_prompt_settings row,
  // create a virtual settings object that includes their preferences
  let effectiveCustomerSettings = customerSettings
  if (!effectiveCustomerSettings) {
    // Use the user's own tone and custom instructions from their profile
    effectiveCustomerSettings = {
      tone: tonePreference === 'friendly and professional' ? 'friendly'
        : tonePreference === 'casual and warm' ? 'friendly'
        : tonePreference === 'formal and corporate' ? 'formal'
        : tonePreference === 'short and direct' ? 'professional'
        : 'friendly',
      custom_instructions: customInstructions,
    } as AIPromptSettings
  } else {
    // If we have a settings row but the user also has their own tone/instructions,
    // layer them in (user-facing fields can supplement admin fields)
    if (!effectiveCustomerSettings.tone && tonePreference) {
      effectiveCustomerSettings = {
        ...effectiveCustomerSettings,
        tone: tonePreference === 'friendly and professional' ? 'friendly'
          : tonePreference === 'casual and warm' ? 'friendly'
          : tonePreference === 'formal and corporate' ? 'formal'
          : tonePreference === 'short and direct' ? 'professional'
          : effectiveCustomerSettings.tone,
      }
    }
    if (!effectiveCustomerSettings.custom_instructions && customInstructions) {
      effectiveCustomerSettings = {
        ...effectiveCustomerSettings,
        custom_instructions: customInstructions,
      }
    }
  }

  const prompt = buildAIPrompt({
    globalSettings,
    customerSettings: effectiveCustomerSettings,
    businessName,
    businessLocation,
    starRating,
    reviewerName: reviewerName || 'Customer',
    reviewText,
  })

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250514',
    max_tokens: 300,
    system: prompt.system,
    messages: [{ role: 'user', content: prompt.user }],
  })

  const textBlock = message.content.find((block) => block.type === 'text')
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text response from Claude')
  }

  return textBlock.text.trim()
}
