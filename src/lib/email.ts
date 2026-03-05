import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'

let _resend: Resend | null = null

function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY!)
  }
  return _resend
}

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'ReviewFlow <notifications@reviewflow.app>'

// ── Branding helper ──────────────────────────────────────────────────

interface BrandingConfig {
  appName: string
  logoUrl: string | null
  primaryColor: string
}

async function getBranding(): Promise<BrandingConfig> {
  try {
    const adminClient = createAdminClient()
    const { data } = await adminClient
      .from('branding_settings')
      .select('app_name, logo_url, primary_color')
      .eq('id', 1)
      .single()

    if (data) {
      return {
        appName: data.app_name || 'ReviewFlow',
        logoUrl: data.logo_url || null,
        primaryColor: data.primary_color || '#2563eb',
      }
    }
  } catch {
    // Fall back to defaults
  }
  return { appName: 'ReviewFlow', logoUrl: null, primaryColor: '#2563eb' }
}

// ── Star rendering helper ────────────────────────────────────────────

function starsHtml(rating: number): string {
  const filled = '★'.repeat(rating)
  const empty = '☆'.repeat(5 - rating)
  return `<span style="color: #f59e0b; font-size: 18px;">${filled}</span><span style="color: #d1d5db; font-size: 18px;">${empty}</span>`
}

function logoHtml(branding: BrandingConfig): string {
  if (branding.logoUrl) {
    return `<img src="${branding.logoUrl}" alt="${branding.appName}" style="height: 24px; margin-right: 8px;" />`
  }
  return ''
}

// ── New Review Notification ──────────────────────────────────────────

interface NewReviewEmailParams {
  to: string
  businessName: string
  locationName?: string | null
  reviewerName: string
  starRating: number
  reviewText: string | null
  dashboardUrl: string
}

export async function sendNewReviewEmail(params: NewReviewEmailParams) {
  const { to, businessName, locationName, reviewerName, starRating, reviewText, dashboardUrl } = params
  const branding = await getBranding()

  const displayName = locationName || businessName

  const reviewBody = reviewText
    ? `<p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 16px 0; padding: 16px; background: #f9fafb; border-radius: 8px; border-left: 4px solid ${starRating >= 4 ? '#10b981' : starRating >= 3 ? '#f59e0b' : '#ef4444'};">"${reviewText}"</p>`
    : `<p style="color: #9ca3af; font-size: 14px; font-style: italic; margin: 16px 0;">No review text — rating only</p>`

  const subject = `New ${starRating}-Star Review at ${displayName}`

  try {
    await getResend().emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto;">
          <div style="padding: 32px 0 16px;">
            <div style="display: flex; align-items: center; margin-bottom: 16px;">
              ${logoHtml(branding)}
              <span style="font-size: 16px; font-weight: 700; color: ${branding.primaryColor};">${branding.appName}</span>
            </div>
            <h2 style="color: #111827; font-size: 20px; margin: 0 0 4px;">New Review Received</h2>
            <p style="color: #6b7280; font-size: 14px; margin: 0;">${displayName}</p>
          </div>

          <div style="border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; background: white;">
            <div style="margin-bottom: 8px;">
              ${starsHtml(starRating)}
            </div>
            <p style="color: #111827; font-size: 15px; font-weight: 600; margin: 0 0 4px;">${reviewerName}</p>
            ${reviewBody}
          </div>

          <div style="padding: 24px 0; text-align: center;">
            <a href="${dashboardUrl}" style="display: inline-block; background: ${branding.primaryColor}; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600;">
              View in Dashboard
            </a>
          </div>

          <div style="border-top: 1px solid #e5e7eb; padding: 16px 0; text-align: center;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              Sent by ${branding.appName}
            </p>
          </div>
        </div>
      `,
    })
  } catch (error) {
    console.error('Failed to send new review email:', error)
  }
}

// ── Weekly Summary Email ─────────────────────────────────────────────

interface WeeklySummaryParams {
  to: string
  businessName: string
  totalReviews: number
  averageRating: number
  repliesPublished: number
  newReviewBreakdown: { stars: number; count: number }[]
  dashboardUrl: string
}

export async function sendWeeklySummaryEmail(params: WeeklySummaryParams) {
  const {
    to,
    businessName,
    totalReviews,
    averageRating,
    repliesPublished,
    newReviewBreakdown,
    dashboardUrl,
  } = params

  const branding = await getBranding()

  const breakdownRows = newReviewBreakdown
    .filter((b) => b.count > 0)
    .map(
      (b) =>
        `<tr>
          <td style="padding: 6px 12px; color: #374151; font-size: 14px;">${starsHtml(b.stars)}</td>
          <td style="padding: 6px 12px; color: #374151; font-size: 14px; text-align: right;">${b.count} review${b.count === 1 ? '' : 's'}</td>
        </tr>`
    )
    .join('')

  const ratingColor =
    averageRating >= 4 ? '#10b981' : averageRating >= 3 ? '#f59e0b' : '#ef4444'

  try {
    await getResend().emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Weekly Review Summary — ${businessName}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto;">
          <div style="padding: 32px 0 16px;">
            <div style="display: flex; align-items: center; margin-bottom: 16px;">
              ${logoHtml(branding)}
              <span style="font-size: 16px; font-weight: 700; color: ${branding.primaryColor};">${branding.appName}</span>
            </div>
            <h2 style="color: #111827; font-size: 20px; margin: 0 0 4px;">Weekly Review Summary</h2>
            <p style="color: #6b7280; font-size: 14px; margin: 0;">${businessName} — Last 7 Days</p>
          </div>

          <!-- Stats Row -->
          <div style="display: flex; gap: 12px; margin-bottom: 24px;">
            <div style="flex: 1; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; text-align: center; background: white;">
              <p style="color: #6b7280; font-size: 12px; margin: 0 0 4px; text-transform: uppercase; letter-spacing: 0.05em;">Reviews</p>
              <p style="color: #111827; font-size: 28px; font-weight: 700; margin: 0;">${totalReviews}</p>
            </div>
            <div style="flex: 1; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; text-align: center; background: white;">
              <p style="color: #6b7280; font-size: 12px; margin: 0 0 4px; text-transform: uppercase; letter-spacing: 0.05em;">Avg Rating</p>
              <p style="color: ${ratingColor}; font-size: 28px; font-weight: 700; margin: 0;">${averageRating > 0 ? averageRating.toFixed(1) : '—'}</p>
            </div>
            <div style="flex: 1; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; text-align: center; background: white;">
              <p style="color: #6b7280; font-size: 12px; margin: 0 0 4px; text-transform: uppercase; letter-spacing: 0.05em;">Published</p>
              <p style="color: #111827; font-size: 28px; font-weight: 700; margin: 0;">${repliesPublished}</p>
            </div>
          </div>

          ${
            breakdownRows
              ? `
          <!-- Breakdown -->
          <div style="border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; background: white; margin-bottom: 24px;">
            <p style="color: #111827; font-size: 14px; font-weight: 600; margin: 0 0 12px;">Rating Breakdown</p>
            <table style="width: 100%; border-collapse: collapse;">
              ${breakdownRows}
            </table>
          </div>
          `
              : ''
          }

          <div style="text-align: center; padding-bottom: 24px;">
            <a href="${dashboardUrl}" style="display: inline-block; background: ${branding.primaryColor}; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600;">
              Open Dashboard
            </a>
          </div>

          <div style="border-top: 1px solid #e5e7eb; padding: 16px 0; text-align: center;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              Sent by ${branding.appName}
            </p>
          </div>
        </div>
      `,
    })
  } catch (error) {
    console.error('Failed to send weekly summary email:', error)
  }
}
