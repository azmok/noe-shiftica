/**
 * Unit tests: neon-backup plugin (Neon API is mocked via fetch)
 *
 * Covers generation selection, the 30-minute throttle, and the
 * create-first-then-delete order of the on-save backup.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  type NeonBranch,
  ON_SAVE_PREFIX,
  generationName,
  generationsToDelete,
  isGeneration,
  isTooSoon,
  triggerNeonBackup,
} from '@/plugins/neon-backup'

const branch = (id: string, name: string, created_at: string, primary = false): NeonBranch => ({
  id,
  name,
  created_at,
  primary,
})

const main = branch('main', 'main', '2026-01-01T00:00:00Z', true)

describe('generation helpers', () => {
  it('matches the prefix itself (legacy name) and timestamped names only', () => {
    expect(isGeneration('backup/on-save', ON_SAVE_PREFIX)).toBe(true)
    expect(isGeneration('backup/on-save-20261018-213214', ON_SAVE_PREFIX)).toBe(true)
    expect(isGeneration('backup/on-saved', ON_SAVE_PREFIX)).toBe(false)
    expect(isGeneration('backup/pre-deploy-20261018-213214', ON_SAVE_PREFIX)).toBe(false)
  })

  it('names generations with a JST timestamp', () => {
    expect(generationName(ON_SAVE_PREFIX, new Date('2026-10-18T12:32:14Z'))).toBe(
      'backup/on-save-20261018-213214',
    )
  })

  it('keeps the newest generations and returns the older ones', () => {
    const branches = [
      main,
      branch('a', 'backup/on-save-1', '2026-10-18T01:00:00Z'),
      branch('c', 'backup/on-save-3', '2026-10-18T03:00:00Z'),
      branch('b', 'backup/on-save-2', '2026-10-18T02:00:00Z'),
      branch('d', 'backup/pre-deploy-1', '2026-10-18T00:00:00Z'),
    ]
    expect(generationsToDelete(branches, ON_SAVE_PREFIX, 2).map((b) => b.id)).toEqual(['a'])
  })

  it('is too soon only while the latest generation is younger than the interval', () => {
    const branches = [main, branch('a', 'backup/on-save-1', '2026-10-18T12:00:00Z')]
    const at = (iso: string) => Date.parse(iso)
    expect(isTooSoon(branches, ON_SAVE_PREFIX, at('2026-10-18T12:29:59Z'), 30 * 60 * 1000)).toBe(true)
    expect(isTooSoon(branches, ON_SAVE_PREFIX, at('2026-10-18T12:30:00Z'), 30 * 60 * 1000)).toBe(false)
    expect(isTooSoon([main], ON_SAVE_PREFIX, at('2026-10-18T12:00:00Z'), 30 * 60 * 1000)).toBe(false)
  })
})

describe('triggerNeonBackup', () => {
  const now = new Date('2026-10-18T13:00:00Z')
  let existing: NeonBranch[]
  let createResponse: unknown
  const fetchMock = vi.fn(async (url: string, init?: { method?: string; body?: string }) => {
    if (init?.method === 'POST') return new Response(JSON.stringify(createResponse))
    if (init?.method === 'DELETE') return new Response('{}')
    return new Response(JSON.stringify({ branches: existing }))
  })
  const calls = (method: string) => fetchMock.mock.calls.filter(([, init]) => init?.method === method)

  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('fetch', fetchMock)
    vi.stubEnv('NEON_API_TOKEN', 'token')
    vi.stubEnv('NEON_PROJECT_ID', 'proj')
    vi.spyOn(console, 'log').mockImplementation(() => {})
    existing = [
      main,
      branch('old', 'backup/on-save-20261018-100000', '2026-10-18T01:00:00Z'),
      branch('newer', 'backup/on-save-20261018-200000', '2026-10-18T11:00:00Z'),
      branch('deploy', 'backup/pre-deploy', '2026-10-18T00:00:00Z'),
    ]
    createResponse = {
      branch: branch('created', 'backup/on-save-20261018-220000', '2026-10-18T13:00:00Z'),
    }
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('creates a new generation from production, then deletes only the ones beyond 2', async () => {
    await triggerNeonBackup(now)

    const [, create] = calls('POST')[0]
    expect(JSON.parse(create!.body!)).toEqual({
      branch: { name: 'backup/on-save-20261018-220000', parent_id: 'main' },
    })
    const deleted = calls('DELETE').map(([url]) => url.split('/').pop())
    expect(deleted).toEqual(['old'])

    // create happens before any delete
    const methods = fetchMock.mock.calls.map(([, init]) => init?.method ?? 'GET')
    expect(methods).toEqual(['GET', 'POST', 'DELETE'])
  })

  it('deletes nothing when the new generation could not be created', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    createResponse = { message: 'branches limit exceeded' }
    await triggerNeonBackup(now)
    expect(calls('POST')).toHaveLength(1)
    expect(calls('DELETE')).toHaveLength(0)
  })

  it('skips when the latest on-save generation is less than 30 minutes old', async () => {
    existing.push(branch('recent', 'backup/on-save-20261018-215000', '2026-10-18T12:50:00Z'))
    await triggerNeonBackup(now)
    expect(calls('POST')).toHaveLength(0)
    expect(calls('DELETE')).toHaveLength(0)
  })

  it('does nothing without credentials', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.stubEnv('NEON_API_TOKEN', '')
    await triggerNeonBackup(now)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
