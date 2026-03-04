import Anthropic from '@anthropic-ai/sdk'
import { createAdminClient } from '@/lib/supabase/admin'
import type { AIPromptSettings } from '@/lib/types'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

// ── Default prompts (used when no DB settings exist) ────────────────

const DEFAULT_BASE_PROMPT = `You are a professional review reply assistant for a car wash business. Write friendly, human-sounding replies that match the business owner's tone. Never sound robotic or generic. Address specific details mentioned in the review. Keep replies concise — 2-4 sentences max.`

const DEFAULT_STAR_INSTRUCTIONS: Record<number, string> = {
  1: `Apologise sincerely. Acknowledge their frustration. Invite them to contact the business directly to resolve the issue. Never offer refunds or compensation unless the business instructions say otherwise. Keep it professional and empathetic.`,
  2: `Acknowledge the mixed experience. Thank them for the feedback. Mention that the team is working to improve. Invite them to give you another try.`,
  3: `Thank them for the honest feedback. Acknowledge what went well and what could improve. Show you take feedback seriously.`,
  4: `Thank them warmly. Acknowledge the specific positive things they mentioned. Express hope to earn that 5th star next time.`,
  5: `Thank them enthusiastically. Reference specific details from their review. Invite them back. Keep it warm and genuine.`,
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
  userId: string
): Promise<{
  global: AIPromptSettings | null
  customer: AIPromptSettings | null
}> {
  const adminClient = createAdminClient()

  // Fetch global and customer-specific settings in parallel
  const [globalResult, customerResult] = await Promise.all([
    adminClient
      .from('ai_prompt_settings')
      .select('*')
      .is('user_id', null)
      .single(),
    adminClient
      .from('ai_prompt_settings')
      .select('*')
      .eq('user_id', userId)
      .single(),
  ])

  return {
    global: globalResult.data || null,
    customer: customerResult.data || null,
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
  } = params

  // Fetch AI settings from DB
  const { global: globalSettings, customer: customerSettings } =
    await getAISettings(userId)

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
    model: 'claude-sonnet-4-5-20250929',
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
