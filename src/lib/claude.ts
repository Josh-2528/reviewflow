import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

interface GenerateReplyParams {
  businessName: string
  businessLocation: string
  tonePreference: string
  customInstructions: string | null
  starRating: number
  reviewText: string | null
}

export async function generateReviewReply(
  params: GenerateReplyParams
): Promise<string> {
  const {
    businessName,
    businessLocation,
    tonePreference,
    customInstructions,
    starRating,
    reviewText,
  } = params

  const reviewContent = reviewText
    ? `${starRating} stars\n\n"${reviewText}"`
    : `${starRating} stars (no text provided)`

  const customInstructionsLine = customInstructions
    ? `\nCustom instructions: ${customInstructions}`
    : ''

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 300,
    system: `You are a review reply assistant for a local business. You write short, genuine, human-sounding replies to Google reviews. Never sound robotic or corporate. Never use exclamation marks more than once. Never start with "Thank you for your review". Be specific — reference something the reviewer mentioned when possible.`,
    messages: [
      {
        role: 'user',
        content: `Business: ${businessName} in ${businessLocation}
Tone: ${tonePreference}${customInstructionsLine}

Review: ${reviewContent}

Write a reply in 1-3 sentences. If the review is positive, be warm and specific. If negative, be empathetic, take ownership, and invite them to contact us directly. If the review is just a star rating with no text, write a brief thank you for positive (4-5 stars) or a brief "we'd love to hear more about your experience" for negative (1-3 stars).`,
      },
    ],
  })

  const textBlock = message.content.find((block) => block.type === 'text')
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text response from Claude')
  }

  return textBlock.text.trim()
}
