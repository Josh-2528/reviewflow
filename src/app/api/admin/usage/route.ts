import { NextResponse } from 'next/server'
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

export async function GET() {
  try {
    const admin = await verifyAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const adminClient = createAdminClient()

    // Date boundaries
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

    // 1. Fetch all usage logs for this month (for summary + per-user monthly stats)
    const { data: monthlyLogs, error: monthlyError } = await adminClient
      .from('api_usage_log')
      .select('*')
      .gte('created_at', startOfMonth)
      .order('created_at', { ascending: false })

    if (monthlyError) {
      console.error('Usage fetch error:', monthlyError)
      return NextResponse.json({ error: 'Failed to fetch usage data' }, { status: 500 })
    }

    // 2. Fetch last 30 days for daily breakdown
    const { data: last30DaysLogs } = await adminClient
      .from('api_usage_log')
      .select('estimated_cost_usd, input_tokens, output_tokens, created_at')
      .gte('created_at', thirtyDaysAgo)
      .order('created_at', { ascending: true })

    // 3. Fetch all-time totals per user
    const { data: allTimeLogs } = await adminClient
      .from('api_usage_log')
      .select('user_id, estimated_cost_usd')

    // 4. Fetch all users for email/business name enrichment
    const { data: allUsers } = await adminClient
      .from('users')
      .select('id, email, business_name')

    const userMap: Record<string, { email: string; business_name: string | null }> = {}
    if (allUsers) {
      for (const u of allUsers) {
        userMap[u.id] = { email: u.email, business_name: u.business_name }
      }
    }

    // ── Summary stats ──
    const totalCostMonth = (monthlyLogs || []).reduce(
      (sum, log) => sum + Number(log.estimated_cost_usd),
      0
    )
    const totalCallsMonth = (monthlyLogs || []).length
    const avgCostPerReply = totalCallsMonth > 0 ? totalCostMonth / totalCallsMonth : 0

    // ── Per-user breakdown ──
    const perUser: Record<
      string,
      {
        email: string
        business_name: string | null
        calls_today: number
        calls_month: number
        cost_today: number
        cost_month: number
        total_cost: number
      }
    > = {}

    // Process monthly logs for per-user month + today stats
    for (const log of monthlyLogs || []) {
      if (!perUser[log.user_id]) {
        const info = userMap[log.user_id] || { email: 'Unknown', business_name: null }
        perUser[log.user_id] = {
          email: info.email,
          business_name: info.business_name,
          calls_today: 0,
          calls_month: 0,
          cost_today: 0,
          cost_month: 0,
          total_cost: 0,
        }
      }
      perUser[log.user_id].calls_month++
      perUser[log.user_id].cost_month += Number(log.estimated_cost_usd)

      if (log.created_at >= startOfDay) {
        perUser[log.user_id].calls_today++
        perUser[log.user_id].cost_today += Number(log.estimated_cost_usd)
      }
    }

    // Add all-time totals
    if (allTimeLogs) {
      for (const log of allTimeLogs) {
        if (!perUser[log.user_id]) {
          const info = userMap[log.user_id] || { email: 'Unknown', business_name: null }
          perUser[log.user_id] = {
            email: info.email,
            business_name: info.business_name,
            calls_today: 0,
            calls_month: 0,
            cost_today: 0,
            cost_month: 0,
            total_cost: 0,
          }
        }
        perUser[log.user_id].total_cost += Number(log.estimated_cost_usd)
      }
    }

    // Sort by monthly cost descending
    const userBreakdown = Object.values(perUser).sort((a, b) => b.cost_month - a.cost_month)

    // ── Daily breakdown (last 30 days) ──
    const dailyMap: Record<
      string,
      { date: string; calls: number; cost: number; input_tokens: number; output_tokens: number }
    > = {}
    for (const log of last30DaysLogs || []) {
      const date = log.created_at.slice(0, 10) // YYYY-MM-DD
      if (!dailyMap[date]) {
        dailyMap[date] = { date, calls: 0, cost: 0, input_tokens: 0, output_tokens: 0 }
      }
      dailyMap[date].calls++
      dailyMap[date].cost += Number(log.estimated_cost_usd)
      dailyMap[date].input_tokens += log.input_tokens
      dailyMap[date].output_tokens += log.output_tokens
    }
    const dailyBreakdown = Object.values(dailyMap).sort((a, b) => b.date.localeCompare(a.date))

    return NextResponse.json({
      summary: {
        total_cost_month: totalCostMonth,
        total_calls_month: totalCallsMonth,
        avg_cost_per_reply: avgCostPerReply,
      },
      user_breakdown: userBreakdown,
      daily_breakdown: dailyBreakdown,
    })
  } catch (error) {
    console.error('Admin usage error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
