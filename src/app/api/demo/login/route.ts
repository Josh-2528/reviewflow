import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

const DEMO_EMAIL = 'demo@reviewflow.app'
const DEMO_PASSWORD = 'demo-reviewflow-2026'

export async function POST() {
  try {
    const adminClient = createAdminClient()

    // Verify demo user exists
    const { data: existingUsers } = await adminClient.auth.admin.listUsers()
    const demoUser = existingUsers?.users?.find((u) => u.email === DEMO_EMAIL)

    if (!demoUser) {
      return NextResponse.json(
        { error: 'Demo account not set up. Run the seed script first.' },
        { status: 404 }
      )
    }

    // Sign in as demo user via the server supabase client (sets cookies)
    const supabase = await createClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
    })

    if (error) {
      console.error('Demo login failed:', error)
      return NextResponse.json(
        { error: 'Demo login failed. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Demo login successful',
      user: { id: data.user.id, email: data.user.email },
    })
  } catch (error) {
    console.error('Demo login error:', error)
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}
