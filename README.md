# Scout — AI Spend Tracker

**See exactly what AI APIs are costing you, right in VS Code. Every time you code.**

No proxy. No code changes. No SDK. Just a number in your status bar that tells you the truth.

![Scout status bar and spend panel](media/marketplace-hero.png)

---

## What it does

Scout shows your real AI API spend in the VS Code status bar — updated automatically, no browser tab required.

```
$(scout-outline) $47.20 leaving this month
```

Click it. Get the full breakdown:

- **Total this month** — the anchor number everything else is judged against
- **Today's spend** — what left today, right now
- **Projected month total** — on pace for what? (also shown in the status bar near month-end)
- **Top provider** — which API is driving the bill
- **Days left** — how much runway before month-end
- **Spike alerts** — popup the moment your spend jumps unexpectedly
- **Notifications** — alerts firing, syncs failing and recovering, plan changes: the same
  events as the dashboard bell, in the sidebar and as VS Code notifications
- **Your seat** — on a shared workspace, Scout says up front whether you can change things,
  instead of sending you to the dashboard to find out

**New:** **Scout: Try Demo** shows sample spend instantly — no account required — so you feel the habit before you connect.

---

## Providers supported

| Provider | Tracked |
|----------|---------|
| OpenAI (GPT-4o, o1, o3, mini) | ✓ |
| Anthropic (Claude Sonnet, Haiku, Opus) | ✓ |
| Google Gemini | ✓ |
| OpenRouter (300+ models) | ✓ |
| Azure OpenAI | ✓ |
| AWS Bedrock | ✓ |
| Cursor (Pro subscription + BYOK) | ✓ |

All providers. One number. One place.

---

## How to set up

1. **Install Scout** and open the Activity Bar gecko (or complete the Getting Started walkthrough)
2. **Try demo** for sample numbers — or **paste** your Widget Token if you already use TryTokka
3. **New to TryTokka?** [Create a free account](https://trytokka.com/signup?ref=vscode) → connect providers → copy Widget Token from Settings → Apps

Done. Scout starts watching instantly.

---

## Why read-only keys?

Scout uses TryTokka's backend, which connects to AI provider billing APIs with read-only admin keys. Your traffic is never proxied. We only ever read usage data — we cannot make API calls, create resources, or incur charges on your behalf.

Full security details: [trytokka.com/security](https://trytokka.com/security)

---

## Shared workspaces

If you hold a **viewer** or **member** seat on someone else's TryTokka workspace, Scout shows
an amber read-only note and adjusts its advice — "ask your workspace owner to set an alert"
rather than "set an alert", because only the owner can.

The spend figures are the workspace's, read from the owner, so everyone on the team sees the
same numbers. The seat describes you.

---

## Notifications

Scout surfaces the same events as the dashboard bell: an alert firing, a provider sync
failing or recovering, a plan change. They appear in the sidebar, and new ones also arrive as
VS Code notifications — warnings for alerts and sync failures, information for the rest.

Each is announced **once**. Scout does not replay everything unread in your dashboard, so
opening VS Code after a quiet week does not bury you. Set `scout.showNotifications` to
`false` to keep them in the sidebar only.

---

## Status bar colours

| Colour | Meaning |
|--------|---------|
| Default | Spend within normal range |
| Yellow | Approaching your configured alert threshold, or elevated month-end pace |
| Red | Alert threshold crossed, or sudden spike detected |

---

## Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `scout.refreshIntervalMinutes` | `30` | How often to fetch fresh data |
| `scout.showInStatusBar` | `true` | Show/hide the status bar item |
| `scout.localAlertThresholdUsd` | `0` | Local VS Code alert (0 = off). For email alerts, set them in TryTokka. |
| `scout.showNotifications` | `true` | Show a VS Code notification for new alerts, sync failures and plan changes. Off keeps them in the sidebar only. |

---

## TryTokka — the full dashboard

Scout gives you the number. [TryTokka](https://trytokka.com) gives you:

- **Email alerts** — get notified before your bill arrives
- **Model optimizer** — which model to switch and how much you'd save
- **Spend forecasting** — on pace for what this month?
- **Spike investigation** — click any day, see which model caused the jump
- **Team plans** — shared spend visibility for the whole team

[Start free → trytokka.com](https://trytokka.com/signup?ref=vscode)

---

## Commands

| Command | Description |
|---------|-------------|
| `Scout: Try Demo (Sample Spend)` | Show realistic sample data immediately |
| `Scout: Paste Widget Token` | Connect with an existing TryTokka token |
| `Scout: Connect TryTokka Account` | Demo, signup, or paste token |
| `Scout: Disconnect Account` | Remove your token / exit demo |
| `Scout: Refresh Now` | Fetch the latest spend data immediately |
| `Scout: Open Spend Panel` | Open the sidebar breakdown |
| `Scout: Start Free — trytokka.com` | Open TryTokka signup in your browser |

---

## Privacy

- Your widget token is stored in VS Code's encrypted `SecretStorage` (OS keychain)
- No API keys are stored in this extension — token only
- Scout makes read-only GET requests to `trytokka.com/api/widget-summary`
- Demo mode never leaves your machine (sample numbers only)
- No telemetry, no analytics, no data collection by this extension

---

## Links

- [TryTokka](https://trytokka.com) — the full dashboard
- [GitHub](https://github.com/acsavenhq/trytokka-vscode-ext) — source code
- [Support](https://trytokka.com/support) — get help
- [Security](https://trytokka.com/security) — how we protect your keys

---

*Scout is built by [TryTokka](https://trytokka.com). Made for developers who ship with AI.*
