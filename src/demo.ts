/**
 * src/demo.ts
 * Sample spend payload for tyre-kickers — delivers a 60s aha before account signup.
 */
import type { SpendData } from './api'

/** Sentinel stored instead of a real widget token while demo mode is on. */
export const DEMO_TOKEN = '__SCOUT_DEMO__'

export function isDemoToken(token: string | undefined): boolean {
  return token === DEMO_TOKEN
}

/** Fixed, realistic sample so status bar + sidebar feel alive immediately. */
export function demoSpendData(now = new Date()): SpendData {
  const day = Math.max(1, now.getDate())
  // Pace ≈ $1.52/day → ~$47 on day 15 of a 31-day month
  const monthCost = Math.round(1.52 * day * 100) / 100
  const todayCost = Math.min(2.14, monthCost)
  return {
    todayCost,
    monthCost,
    totalCost: Math.round(monthCost * 1.35 * 100) / 100,
    topProvider: 'OpenAI',
    alertStatus: monthCost > 40 ? 'warning' : 'safe',
    lastUpdated: now.toISOString(),
    lastSuccessfulSyncAt: now.toISOString(),
    // Demo mode shows the product at its best: an owner who can act on what they see.
    // A read-only demo would advertise a restriction most people will never hit.
    seat: { role: 'owner', canEdit: true },
    notifications: [
      {
        id: 'demo-1',
        type: 'alert_fired',
        title: 'OpenAI spend crossed $40 this month',
        body: 'Scout will keep watching and email you if it climbs further.',
        read: false,
        createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'demo-2',
        type: 'sync_recovered',
        title: 'Anthropic sync recovered',
        body: null,
        read: true,
        createdAt: new Date(now.getTime() - 26 * 60 * 60 * 1000).toISOString(),
      },
    ],
  }
}
