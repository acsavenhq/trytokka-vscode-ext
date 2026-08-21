import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { looksLikeToken, normalizeWidgetToken, parseSpendPayload } from '../api'

describe('looksLikeToken', () => {
  it('accepts exactly 64-char hex widget tokens', () => {
    assert.equal(looksLikeToken('a'.repeat(64)), true)
    assert.equal(looksLikeToken('0123456789abcdef'.repeat(4)), true)
    assert.equal(looksLikeToken('ABCDEF0123456789'.repeat(4)), true)
  })

  it('rejects wrong length, spaces, prefixes, or non-hex', () => {
    assert.equal(looksLikeToken(''), false)
    assert.equal(looksLikeToken('short'), false)
    assert.equal(looksLikeToken('a'.repeat(63)), false)
    assert.equal(looksLikeToken('a'.repeat(65)), false)
    assert.equal(looksLikeToken('token with spaces...............'), false)
    assert.equal(looksLikeToken('tk_live_abcdefghijklmnopqrstuvwxyz'), false)
    assert.equal(looksLikeToken('g'.repeat(64)), false)
  })
})

describe('normalizeWidgetToken', () => {
  it('trims and lowercases', () => {
    assert.equal(normalizeWidgetToken('  ABCD  '), 'abcd')
  })
})

describe('parseSpendPayload', () => {
  it('parses a valid WidgetSummary shape', () => {
    const data = parseSpendPayload({
      todayCost: 1.25,
      monthCost: 40,
      totalCost: 55,
      topProvider: 'openai',
      alertStatus: 'warning',
      lastUpdated: '2026-07-15T10:00:00.000Z',
      lastSuccessfulSyncAt: '2026-07-15T09:30:00.000Z',
    })
    assert.ok(data)
    assert.equal(data!.monthCost, 40)
    assert.equal(data!.alertStatus, 'warning')
    assert.equal(data!.topProvider, 'openai')
    assert.equal(data!.lastSuccessfulSyncAt, '2026-07-15T09:30:00.000Z')
  })

  it('defaults lastSuccessfulSyncAt to null when absent or empty', () => {
    assert.equal(parseSpendPayload({ monthCost: 1 })!.lastSuccessfulSyncAt, null)
    assert.equal(
      parseSpendPayload({ monthCost: 1, lastSuccessfulSyncAt: '' })!.lastSuccessfulSyncAt,
      null,
    )
  })

  it('coerces junk numbers and unknown alertStatus', () => {
    const data = parseSpendPayload({
      todayCost: 'nope',
      monthCost: null,
      alertStatus: 'explode',
      topProvider: 12,
    })
    assert.ok(data)
    assert.equal(data!.todayCost, 0)
    assert.equal(data!.monthCost, 0)
    assert.equal(data!.alertStatus, 'safe')
    assert.equal(data!.topProvider, null)
    assert.ok(data!.lastUpdated)
    assert.equal(data!.lastSuccessfulSyncAt, null)
  })

  it('returns null for non-objects', () => {
    assert.equal(parseSpendPayload(null), null)
    assert.equal(parseSpendPayload('x'), null)
  })
})

describe('parseSpendPayload — seat', () => {
  const base = { todayCost: 1, monthCost: 2, totalCost: 3 }

  it('reads a viewer seat', () => {
    const d = parseSpendPayload({ ...base, seat: { role: 'viewer', canEdit: false } })
    assert.equal(d?.seat.role, 'viewer')
    assert.equal(d?.seat.canEdit, false)
  })

  it('defaults to owner when the server does not send a seat', () => {
    /*
      Backward compatibility, and the direction of the default matters.

      This extension auto-updates independently of the TryTokka deployment it talks to, so
      it will meet servers that predate the field. Defaulting to "cannot edit" would tell a
      real owner they are read-only — a worse error than the one the field prevents, and one
      they cannot dismiss. The server is the actual guard; this only decides what we SAY.
    */
    const d = parseSpendPayload(base)
    assert.equal(d?.seat.role, 'owner')
    assert.equal(d?.seat.canEdit, true)
  })

  it('ignores a role it does not recognise rather than trusting it', () => {
    const d = parseSpendPayload({ ...base, seat: { role: 'superadmin', canEdit: false } })
    assert.equal(d?.seat.role, 'owner', 'unknown role falls back')
    assert.equal(d?.seat.canEdit, false, 'but an explicit canEdit is still honoured')
  })

  it('derives canEdit from the role when only the role is sent', () => {
    const d = parseSpendPayload({ ...base, seat: { role: 'member' } })
    assert.equal(d?.seat.canEdit, false)
  })
})

describe('parseSpendPayload — notifications', () => {
  const base = { todayCost: 1, monthCost: 2, totalCost: 3 }

  it('parses a well-formed list', () => {
    const d = parseSpendPayload({
      ...base,
      notifications: [
        { id: 'n1', type: 'alert_fired', title: 'Spend crossed $40', body: 'x', read: false, createdAt: '2026-08-21T00:00:00Z' },
      ],
    })
    assert.equal(d?.notifications.length, 1)
    assert.equal(d?.notifications[0].type, 'alert_fired')
    assert.equal(d?.notifications[0].read, false)
  })

  it('is an empty list when the server does not send the field', () => {
    assert.deepEqual(parseSpendPayload(base)?.notifications, [])
  })

  it('drops malformed entries instead of rendering undefined', () => {
    // A single bad row must not cost the user the good ones, and must never reach the
    // webview as `undefined` — that renders as the literal text "undefined".
    const d = parseSpendPayload({
      ...base,
      notifications: [null, 'nope', { type: 'system' }, { id: 'ok', title: 'Fine' }],
    })
    assert.equal(d?.notifications.length, 1)
    assert.equal(d?.notifications[0].id, 'ok')
  })

  it('falls back to system for an unrecognised type', () => {
    const d = parseSpendPayload({ ...base, notifications: [{ id: 'a', title: 't', type: 'brand_new' }] })
    assert.equal(d?.notifications[0].type, 'system')
  })

  it('survives notifications being the wrong shape entirely', () => {
    assert.deepEqual(parseSpendPayload({ ...base, notifications: 'oops' })?.notifications, [])
  })
})
