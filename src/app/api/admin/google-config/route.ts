import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

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

// GET /api/admin/google-config?user_id=xxx
// Returns the user's locations and legacy Google fields
export async function GET(request: NextRequest) {
  try {
    const admin = await verifyAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = request.nextUrl.searchParams.get('user_id')
    if (!userId) {
      return NextResponse.json({ error: 'user_id required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Fetch user's locations
    const { data: locations, error: locError } = await supabase
      .from('locations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })

    if (locError) {
      console.error('Failed to fetch locations:', locError)
      return NextResponse.json({ error: 'Failed to fetch locations' }, { status: 500 })
    }

    // Fetch legacy user-level Google fields
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('google_account_id, google_location_id, google_connected')
      .eq('id', userId)
      .single()

    if (userError) {
      console.error('Failed to fetch user:', userError)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ locations: locations || [], user })
  } catch (error) {
    console.error('Google config GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/admin/google-config
// Saves Google Account ID and Location ID to a location and syncs legacy user fields
export async function PUT(request: NextRequest) {
  try {
    const admin = await verifyAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      user_id,
      location_id,
      google_account_id,
      google_location_id,
      create_location,
      location_name,
    } = body

    if (!user_id) {
      return NextResponse.json({ error: 'user_id required' }, { status: 400 })
    }

    if (!google_account_id || !google_location_id) {
      return NextResponse.json(
        { error: 'Both google_account_id and google_location_id are required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Verify the user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('id', user_id)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Update or create the location record
    if (location_id) {
      // Update existing location
      const { error: locError } = await supabase
        .from('locations')
        .update({
          google_account_id,
          google_location_id,
        })
        .eq('id', location_id)
        .eq('user_id', user_id)

      if (locError) {
        console.error('Failed to update location:', locError)
        return NextResponse.json({ error: 'Failed to update location' }, { status: 500 })
      }
    } else if (create_location) {
      // Create a new location with the Google IDs
      const { error: createError } = await supabase.from('locations').insert({
        user_id,
        google_account_id,
        google_location_id,
        location_name: location_name || 'Main Location',
        is_primary: true,
      })

      if (createError) {
        console.error('Failed to create location:', createError)
        return NextResponse.json({ error: 'Failed to create location' }, { status: 500 })
      }
    }

    // Always update legacy user-level fields
    const { error: updateError } = await supabase
      .from('users')
      .update({
        google_account_id,
        google_location_id,
        google_connected: true,
      })
      .eq('id', user_id)

    if (updateError) {
      console.error('Failed to update user Google fields:', updateError)
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
    }

    return NextResponse.json({
      message: `Google configuration saved for ${user.email}`,
    })
  } catch (error) {
    console.error('Google config PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
