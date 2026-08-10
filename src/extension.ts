/**
 * src/extension.ts
 * Scout — AI Spend Tracker · VS Code Extension
 * by TryTokka (https://trytokka.com)
 */
import * as vscode from 'vscode'
import { fetchSpend, looksLikeToken, normalizeWidgetToken } from './api'
import { TRYTOKKA_URLS } from './constants'
import { demoSpendData } from './demo'
import { Storage } from './storage'
import { computePsychState } from './psychology'
import { createStatusBar, updateStatusBar } from './statusBar'
import { ScoutSidebarProvider } from './sidebarProvider'

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  const storage   = new Storage(context.secrets, context.globalState)
  storage.ensureInstallDate()

  const statusBar = createStatusBar()
  context.subscriptions.push(statusBar)

  const sidebarProvider = new ScoutSidebarProvider(context)
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(ScoutSidebarProvider.viewId, sidebarProvider, {
      webviewOptions: { retainContextWhenHidden: true },
    }),
  )

  let refreshTimer: NodeJS.Timeout | undefined
  let refreshInFlight = false
  let lastLocalAlertAt = 0
  let lastPsychShowCta = false

  function scoutConfig() {
    return vscode.workspace.getConfiguration('scout')
  }

  function clampedRefreshMinutes(): number {
    const raw = scoutConfig().get<number>('refreshIntervalMinutes', 30)
    if (!Number.isFinite(raw)) return 30
    return Math.min(120, Math.max(5, raw))
  }

  function maybeRecordCta(): void {
    if (lastPsychShowCta && sidebarProvider.isVisible()) {
      storage.recordCtaImpressionIfNeeded()
    }
  }

  sidebarProvider.onDidChangeVisibility(() => {
    maybeRecordCta()
  })

  async function refresh(): Promise<void> {
    if (refreshInFlight) return
    refreshInFlight = true
    try {
      const demoMode = storage.isDemoMode()
      const token = await storage.getToken()

      if (demoMode) {
        const data = demoSpendData()
        const psychState = computePsychState(data, storage, { demoMode: true })
        lastPsychShowCta = false
        updateStatusBar(statusBar, psychState, true, { demoMode: true })
        sidebarProvider.update(data, psychState, true, { demoMode: true })
        return
      }

      if (!token) {
        lastPsychShowCta = false
        updateStatusBar(statusBar, null, false)
        sidebarProvider.showDisconnected()
        return
      }

      const result = await fetchSpend(token)
      if (!result.ok) {
        if (result.status === 401) {
          await storage.clearToken()
          updateStatusBar(statusBar, null, false)
          sidebarProvider.showDisconnected()
          const choice = await vscode.window.showWarningMessage(
            'Scout: Your TryTokka token is invalid or expired. Please reconnect.',
            'Reconnect',
          )
          if (choice === 'Reconnect') await pasteToken()
          return
        }

        if (!sidebarProvider.hasCachedData()) {
          updateStatusBar(statusBar, null, true)
          statusBar.text = `$(scout-outline) Scout: ${shortErr(result.message)}`
          statusBar.tooltip = result.message
          statusBar.command = 'scout.refresh'
        }
        vscode.window.setStatusBarMessage(`Scout: ${result.message}`, 8000)
        return
      }

      const { data } = result
      const localThreshold = scoutConfig().get<number>('localAlertThresholdUsd', 0) ?? 0
      const psychState = computePsychState(data, storage, {
        localAlertThresholdUsd: localThreshold,
      })
      lastPsychShowCta = psychState.showCta

      if (
        localThreshold > 0 &&
        data.monthCost > localThreshold &&
        Date.now() - lastLocalAlertAt > 6 * 60 * 60 * 1000
      ) {
        lastLocalAlertAt = Date.now()
        const c = await vscode.window.showWarningMessage(
          `Scout: AI spend hit $${data.monthCost.toFixed(2)} this month (your local threshold: $${localThreshold}).`,
          'Open Dashboard',
        )
        if (c === 'Open Dashboard') openDashboard()
      }

      const lastAcked = storage.getLastSpikeAckedCost()
      if (psychState.isSpike && data.monthCost > lastAcked + 2) {
        const c = await vscode.window.showWarningMessage(
          `Scout: Your AI spend just jumped to $${data.monthCost.toFixed(2)} this month.`,
          'Open Dashboard',
          'Dismiss',
        )
        if (c === 'Open Dashboard') openDashboard()
        if (c === 'Open Dashboard' || c === 'Dismiss') storage.ackSpike(data.monthCost)
      }

      storage.setLastMonthCost(data.monthCost)
      maybeRecordCta()

      updateStatusBar(statusBar, psychState, true)
      sidebarProvider.update(data, psychState, true)
    } finally {
      refreshInFlight = false
    }
  }

  function scheduleRefresh(): void {
    if (refreshTimer) clearInterval(refreshTimer)
    const ms = clampedRefreshMinutes() * 60_000
    refreshTimer = setInterval(() => { void refresh() }, ms)
  }

  function applyStatusBarVisibility(): void {
    const show = scoutConfig().get<boolean>('showInStatusBar', true)
    if (show) statusBar.show()
    else statusBar.hide()
  }

  /** Existing TryTokka users — straight to paste (no signup fork). */
  async function pasteToken(): Promise<void> {
    const token = await vscode.window.showInputBox({
      title:       'Scout — Paste Widget Token',
      prompt:      'TryTokka → Settings → Apps → Widget Token',
      placeHolder: '64-character hex token',
      password:    true,
      ignoreFocusOut: true,
      validateInput(value) {
        if (!value?.trim()) return 'Token cannot be empty'
        if (!looksLikeToken(value)) {
          return 'Paste the 64-character hex Widget Token from TryTokka → Settings → Apps.'
        }
        return undefined
      },
    })

    if (!token) return

    const normalized = normalizeWidgetToken(token)
    const testResult = await fetchSpend(normalized)
    if (!testResult.ok) {
      await vscode.window.showErrorMessage(
        `Scout: Token check failed — ${testResult.message}`,
        'Try again',
        'Open Apps settings',
      ).then(c => {
        if (c === 'Try again') void pasteToken()
        if (c === 'Open Apps settings') openAppsSettings()
      })
      return
    }

    await storage.setToken(normalized)
    await vscode.window.showInformationMessage(
      `Scout: Connected! AI spend for this month: $${testResult.data.monthCost.toFixed(2)}`,
    )
    await refresh()
  }

  async function connectAccount(): Promise<void> {
    const choice = await vscode.window.showInformationMessage(
      'Scout needs a TryTokka Widget Token (or try the demo first).',
      'I have a token',
      'Try demo',
      'Create free account →',
    )

    if (!choice) return

    if (choice === 'Try demo') {
      await startDemo()
      return
    }

    if (choice === 'Create free account →') {
      await vscode.env.openExternal(vscode.Uri.parse(TRYTOKKA_URLS.signup))
      await new Promise<void>(r => setTimeout(r, 1500))
    }

    await pasteToken()
  }

  /**
   * Demo uses sample spend only. A saved live token is kept in SecretStorage
   * so exiting demo (or pasting again) restores live data without re-entry.
   */
  async function startDemo(): Promise<void> {
    await storage.enableDemoMode()
    // Seed last cost so demo doesn't look like a spike on every refresh
    storage.setLastMonthCost(demoSpendData().monthCost)
    await vscode.window.showInformationMessage(
      'Scout: Demo mode on — sample spend in your status bar. Paste a Widget Token anytime for live data.',
      'Paste token',
    ).then(c => { if (c === 'Paste token') void pasteToken() })
    await refresh()
    void vscode.commands.executeCommand('workbench.view.extension.scout-sidebar')
  }

  function openDashboard(): void {
    void vscode.env.openExternal(vscode.Uri.parse(TRYTOKKA_URLS.dashboard))
  }

  function openAppsSettings(): void {
    void vscode.env.openExternal(vscode.Uri.parse(TRYTOKKA_URLS.appsSettings))
  }

  context.subscriptions.push(
    vscode.commands.registerCommand('scout.connect', () => connectAccount()),
    vscode.commands.registerCommand('scout.pasteToken', () => pasteToken()),
    vscode.commands.registerCommand('scout.tryDemo', () => startDemo()),

    vscode.commands.registerCommand('scout.disconnect', async () => {
      const inDemo = storage.isDemoMode()
      const confirm = await vscode.window.showWarningMessage(
        inDemo
          ? 'Exit Scout demo mode?'
          : 'Disconnect Scout from TryTokka? Spend tracking will stop.',
        { modal: true },
        inDemo ? 'Exit demo' : 'Disconnect',
      )
      if (confirm === 'Disconnect' || confirm === 'Exit demo') {
        if (inDemo) {
          // Leaving demo restores any previously saved live token.
          await storage.clearDemoMode()
        } else {
          await storage.clearToken()
          await storage.clearDemoMode()
        }
        lastPsychShowCta = false
        await refresh()
        await vscode.window.showInformationMessage(
          confirm === 'Exit demo' ? 'Scout demo ended.' : 'Scout disconnected.',
        )
      }
    }),

    vscode.commands.registerCommand('scout.refresh', () => refresh()),

    vscode.commands.registerCommand('scout.openPanel', () => {
      void vscode.commands.executeCommand('workbench.view.extension.scout-sidebar')
    }),

    vscode.commands.registerCommand('scout.openSignup', () => {
      void vscode.env.openExternal(vscode.Uri.parse(TRYTOKKA_URLS.signup))
    }),

    vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration('scout.refreshIntervalMinutes')) {
        scheduleRefresh()
      }
      if (e.affectsConfiguration('scout.showInStatusBar')) {
        applyStatusBarVisibility()
      }
      if (e.affectsConfiguration('scout.localAlertThresholdUsd')) {
        void refresh()
      }
    }),

    { dispose: () => { if (refreshTimer) clearInterval(refreshTimer) } },
  )

  // Wire webview actions that need host-side handlers
  sidebarProvider.setActionHandler((type) => {
    switch (type) {
      case 'connect':    void connectAccount(); break
      case 'tryDemo':    void startDemo(); break
      case 'pasteToken': void pasteToken(); break
      default: break
    }
  })

  applyStatusBarVisibility()
  await refresh()
  scheduleRefresh()

  // First-run: open sidebar once so people discover the surface (GEO of use)
  if (!storage.hasAutoOpenedSidebar()) {
    storage.markSidebarAutoOpened()
    setTimeout(() => {
      void vscode.commands.executeCommand('workbench.view.extension.scout-sidebar')
    }, 800)
  }
}

function shortErr(message: string): string {
  const m = message.replace(/^Scout:\s*/i, '')
  return m.length > 28 ? `${m.slice(0, 26)}…` : m
}

export function deactivate(): void { /* cleanup via subscriptions */ }
