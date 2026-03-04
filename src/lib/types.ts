export interface User {
  id: string
  email: string
  business_name: string | null
  business_location: string | null
  google_access_token: string | null
  google_refresh_token: string | null
  google_account_id: string | null
  google_location_id: string | null
  tone_preference: string
  custom_instructions: string | null
  auto_publish: boolean
  auto_publish_stars: number[]
  onboarding_completed: boolean
  google_connected: boolean
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  plan_id: string
  subscription_status: string | null
  subscription_current_period_end: string | null
  email_new_review: boolean
  email_weekly_summary: boolean
  trial_started_at: string | null
  created_at: string
  updated_at: string
}

export interface Review {
  id: string
  user_id: string
  google_review_id: string
  reviewer_name: string
  reviewer_photo_url: string | null
  star_rating: number
  review_text: string | null
  review_created_at: string
  has_existing_reply: boolean
  status: 'new' | 'reply_generated' | 'approved' | 'published' | 'skipped'
  created_at: string
  reply?: Reply
}

export interface Reply {
  id: string
  review_id: string
  generated_text: string
  edited_text: string | null
  final_text: string
  status: 'pending' | 'approved' | 'published' | 'rejected'
  auto_published: boolean
  published_at: string | null
  created_at: string
}

export interface ActivityLogEntry {
  id: string
  user_id: string
  action:
    | 'review_detected'
    | 'reply_generated'
    | 'reply_approved'
    | 'reply_published'
    | 'reply_edited'
    | 'reply_rejected'
  review_id: string | null
  details: string | null
  created_at: string
  review?: Review
}

export interface DashboardStats {
  total_reviews_this_month: number
  average_rating_this_month: number
  reviews_awaiting_reply: number
  replies_published_this_month: number
}

export interface BrandingSettings {
  app_name: string
  logo_url: string | null
  primary_color: string
}

export interface AIPromptSettings {
  id: string
  user_id: string | null
  base_system_prompt: string | null
  star_1_instructions: string | null
  star_2_instructions: string | null
  star_3_instructions: string | null
  star_4_instructions: string | null
  star_5_instructions: string | null
  business_context: string | null
  custom_instructions: string | null
  contact_email: string | null
  contact_phone: string | null
  contact_reference_style: string | null
  contact_include_on: string | null
  tone: string | null
  custom_tone_description: string | null
  sign_off: string | null
  do_not_mention: string | null
  always_mention: string | null
  created_at: string
  updated_at: string
}

export interface OnboardingProgress {
  google_connected: boolean
  has_reviewed_reply: boolean
  has_published_reply: boolean
  email_notifications_on: boolean
}
