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
