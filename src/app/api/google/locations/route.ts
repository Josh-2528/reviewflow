import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { listAccounts, listLocations } from '@/lib/google'

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Discover Google Business accounts
    let accountsData
    try {
      accountsData = await listAccounts(user.id)
    } catch (err) {
      console.error('Failed to list Google accounts:', err)
      return NextResponse.json(
        { error: 'Failed to fetch Google Business accounts. Please try reconnecting your Google account.' },
        { status: 400 }
      )
    }

    const accounts = accountsData.accounts || []
    if (accounts.length === 0) {
      return NextResponse.json({ locations: [], message: 'No Google Business accounts found on this Google account.' })
    }

    // Discover locations across all accounts
    interface DiscoveredLocation {
      accountId: string
      locationId: string
      locationName: string
      address: string | null
    }

    const discoveredLocations: DiscoveredLocation[] = []

    for (const account of accounts) {
      // account.name is like "accounts/123456789"
      const accountName = account.name as string
      if (!accountName) continue

      try {
        const locationsData = await listLocations(user.id, accountName)
        const locs = locationsData.locations || []

        for (const loc of locs) {
          // loc.name is like "locations/123456789" or "accounts/xxx/locations/yyy"
          const locName = loc.name as string
          if (!locName) continue

          // Extract the account ID (number after "accounts/")
          const accountIdMatch = accountName.match(/accounts\/(.+)/)
          const accountId = accountIdMatch ? accountIdMatch[1] : accountName

          // Extract the location ID (number after "locations/")
          const locationIdMatch = locName.match(/locations\/(.+)/)
          const locationId = locationIdMatch ? locationIdMatch[1] : locName

          // Build address string from storefrontAddress
          const addr = loc.storefrontAddress as Record<string, unknown> | undefined
          let address: string | null = null
          if (addr) {
            const parts = [
              addr.addressLines ? (addr.addressLines as string[]).join(', ') : null,
              addr.locality,
              addr.administrativeArea,
              addr.postalCode,
            ].filter(Boolean)
            address = parts.join(', ') || null
          }

          discoveredLocations.push({
            accountId,
            locationId,
            locationName: (loc.title as string) || 'Unnamed Location',
            address,
          })
        }
      } catch (err) {
        console.error(`Failed to list locations for ${accountName}:`, err)
        // Continue with other accounts
      }
    }

    return NextResponse.json({ locations: discoveredLocations })
  } catch (error) {
    console.error('Google locations discovery error:', error)
    return NextResponse.json({ error: 'Failed to discover Google Business locations' }, { status: 500 })
  }
}
