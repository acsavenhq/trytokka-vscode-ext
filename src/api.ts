/**
 * src/api.ts
 * TryTokka widget API client.
 *
 * Calls /api/widget-summary with a Bearer token.
 * Same endpoint used by the Chrome extension and dashboard widget.
 * No proxy, no code changes — read-only billing data only.
 */

import { TRYTOKKA_URLS } from './constants'

const TIMEOUT_MS = 10_000

export interface SpendData {
  todayCost: number
  monthCost: number
  totalCost: number        // rolling 30-day
  topProvider: string | null
  alertStatus: 'safe' | 'warning' | 'critical'
  lastUpdated: string      // ISO timestamp — response generation time (always ~now)
  lastSuccessfulSyncAt: string | null // ISO timestamp of the last real provider sync; null before the first sync
}

export type FetchResult =
  | { ok: true;  data: SpendData }
  | { ok: false; status: number; message: string }

function asFiniteNumber(value: unknown, fallback = 0): number {
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : fallback
}

/** Normalize/validate API JSON so a malformed payload never crashes the UI. */
export function parseSpendPayload(raw: unknown): SpendData | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const alert = o.alertStatus
  const alertStatus =
    alert === 'warning' || alert === 'critical' || alert === 'safe' ? alert : 'safe'
  const top =
    typeof o.topProvider === 'string' && o.topProvider.trim()
      ? o.topProvider.trim()
      : null
  const lastUpdated =
    typeof o.lastUpdated === 'string' && o.lastUpdated
      ? o.lastUpdated
      : new Date().toISOString()
  // Real data freshness. null is meaningful (valid token, no successful sync yet),
  // so only a non-empty string counts as a sync time — anything else stays null.
  const lastSuccessfulSyncAt =
    typeof o.lastSuccessfulSyncAt === 'string' && o.lastSuccessfulSyncAt
      ? o.lastSuccessfulSyncAt
      : null

  return {
    todayCost: asFiniteNumber(o.todayCost),
    monthCost: asFiniteNumber(o.monthCost),
    totalCost: asFiniteNumber(o.totalCost),
    topProvider: top,
    alertStatus,
    lastUpdated,
    lastSuccessfulSyncAt,
  }
}

/**
 * Fetch spend summary from TryTokka.
 * Returns structured result — never throws — so callers don't need try/catch.
 */
export async function fetchSpend(token: string): Promise<FetchResult> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const res = await fetch(TRYTOKKA_URLS.widgetSummary, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      signal: controller.signal,
    })

    clearTimeout(timer)

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      return {
        ok: false,
        status: res.status,
        message: res.status === 401
          ? 'Token invalid or expired — reconnect your account.'
          : res.status === 429
          ? 'Rate limited — try again in a few minutes.'
          : `Server error ${res.status}: ${body.slice(0, 100)}`,
      }
    }

    let json: unknown
    try {
      json = await res.json()
    } catch {
      return { ok: false, status: res.status, message: 'Server returned invalid JSON.' }
    }

    const data = parseSpendPayload(json)
    if (!data) {
      return { ok: false, status: res.status, message: 'Server returned an unexpected spend payload.' }
    }
    return { ok: true, data }

  } catch (err) {
    clearTimeout(timer)
    const isAbort = err instanceof Error && err.name === 'AbortError'
    return {
      ok: false,
      status: 0,
      message: isAbort
        ? 'Request timed out — check your internet connection.'
        : `Network error: ${err instanceof Error ? err.message : String(err)}`,
    }
  }
}

/**
 * Client-side token shape check before network.
 * Matches server WidgetTokenSchema: exactly 64 lowercase hex characters
 * (case-insensitive here — callers should normalize with normalizeWidgetToken).
 */
export function looksLikeToken(value: string): boolean {
  return /^[a-f0-9]{64}$/i.test(value.trim())
}

/** Normalize a pasted widget token for storage / API (trim + lowercase hex). */
export function normalizeWidgetToken(value: string): string {
  return value.trim().toLowerCase()
}
