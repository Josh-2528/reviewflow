import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminClient = createAdminClient()
    const { data: locations, error } = await adminClient
      .from('locations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching locations:', error)
      return NextResponse.json({ error: 'Failed to fetch locations' }, { status: 500 })
    }

    return NextResponse.json({ locations: locations || [] })
  } catch (error) {
    console.error('Locations API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminClient = createAdminClient()

    // Check current count
    const { count } = await adminClient
      .from('locations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if ((count ?? 0) >= 3) {
      return NextResponse.json(
        { error: 'Maximum of 3 locations allowed per account' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const {
      google_account_id,
      google_location_id,
      location_name,
      location_address,
      contact_name,
      contact_email,
      contact_phone,
      is_primary,
    } = body

    // If this is set as primary, unset others
    if (is_primary) {
      await adminClient
        .from('locations')
        .update({ is_primary: false })
        .eq('user_id', user.id)
    }

    // If first location, make it primary
    const shouldBePrimary = is_primary || (count ?? 0) === 0

    const { data: location, error } = await adminClient
      .from('locations')
      .insert({
        user_id: user.id,
        google_account_id: google_account_id || null,
        google_location_id: google_location_id || null,
        location_name: location_name || null,
        location_address: location_address || null,
        contact_name: contact_name || null,
        contact_email: contact_email || null,
        contact_phone: contact_phone || null,
        is_primary: shouldBePrimary,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating location:', error)
      return NextResponse.json({ error: 'Failed to create location' }, { status: 500 })
    }

    return NextResponse.json({ location })
  } catch (error) {
    console.error('Create location error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Location id is required' }, { status: 400 })
    }

    const allowedFields = [
      'location_name',
      'location_address',
      'contact_name',
      'contact_email',
      'contact_phone',
      'is_primary',
      'google_account_id',
      'google_location_id',
    ]

    const safeUpdates: Record<string, unknown> = {}
    for (const field of allowedFields) {
      if (field in updates) {
        safeUpdates[field] = updates[field]
      }
    }

    const adminClient = createAdminClient()

    // Verify ownership
    const { data: existing } = await adminClient
      .from('locations')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 })
    }

    // If setting as primary, unset others
    if (safeUpdates.is_primary) {
      await adminClient
        .from('locations')
        .update({ is_primary: false })
        .eq('user_id', user.id)
    }

    const { error } = await adminClient
      .from('locations')
      .update(safeUpdates)
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error updating location:', error)
      return NextResponse.json({ error: 'Failed to update location' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Location updated' })
  } catch (error) {
    console.error('Update location error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const id = url.searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Location id is required' }, { status: 400 })
    }

    const adminClient = createAdminClient()

    const { error } = await adminClient
      .from('locations')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting location:', error)
      return NextResponse.json({ error: 'Failed to delete location' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Location removed' })
  } catch (error) {
    console.error('Delete location error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
