/**
 * Shared TryTokka origin + deep links used by the extension host and webview.
 * Keep product URLs here so API / CTA / sidebar stay in sync.
 */
export const TRYTOKKA_ORIGIN = 'https://trytokka.com'

export const TRYTOKKA_URLS = {
  home: TRYTOKKA_ORIGIN,
  signup: `${TRYTOKKA_ORIGIN}/signup`,
  dashboard: `${TRYTOKKA_ORIGIN}/dashboard`,
  pricing: `${TRYTOKKA_ORIGIN}/pricing`,
  /** Settings → Apps & widget (where users create / copy a Widget Token). */
  appsSettings: `${TRYTOKKA_ORIGIN}/dashboard/settings?tab=apps`,
  widgetSummary: `${TRYTOKKA_ORIGIN}/api/widget-summary`,
} as const
