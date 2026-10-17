// @vitest-environment jsdom
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  FewsConfigLoadError,
  handleStartupError,
  StartupError,
  runStartupStage,
} from '../../../src/lib/startup/startup-error'
import {
  CONFIG_ERROR_STORAGE_KEY,
  CONFIG_ERROR_SOURCE_STORAGE_KEY,
  CONFIG_ERROR_CONTEXT_STORAGE_KEY,
} from '../../../src/lib/startup/startup-constants'
import { getFewsConfig } from '../../../src/lib/fews-config'

const { getWebOcConfiguration } = vi.hoisted(() => ({
  getWebOcConfiguration: vi.fn(),
}))

vi.mock('@deltares/fews-pi-requests', () => ({
  PiWebserviceProvider: class {
    getWebOcConfiguration = getWebOcConfiguration
  },
}))
vi.mock('../../../src/services/application-config/index.ts', () => ({
  configManager: { get: () => 'https://example.test/FewsWebServices' },
}))
vi.mock('@/lib/requests/transformRequest', () => ({
  createTransformRequestFn: () => vi.fn(),
}))

const errorPage = readFileSync(
  resolve(process.cwd(), 'error/index.html'),
  'utf8',
)

describe('startup error deployment checks', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.stubGlobal('__GIT_TAG__', '')
    vi.stubGlobal('__GIT_HASH__', 'abc1234')
    vi.stubGlobal('__BUILD_DATE__', '2026-10-17T12:00:00.000Z')
    sessionStorage.clear()
    window.history.replaceState(null, '', '/error/')
    document.documentElement.innerHTML = errorPage
    vi.spyOn(performance, 'getEntriesByType').mockReturnValue([])
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('shows FEWS PI checks and preserves the original timeout details', async () => {
    const timeout = new Error('Request timed out')
    getWebOcConfiguration.mockRejectedValueOnce(timeout)
    const error = await getFewsConfig().catch((reason: unknown) => reason)
    expect(error).toBeInstanceOf(FewsConfigLoadError)
    expect(error).toHaveProperty('cause', timeout)

    handleStartupError(error)
    expect(sessionStorage.getItem(CONFIG_ERROR_SOURCE_STORAGE_KEY)).toBe(
      'fews-pi',
    )
    await import('../../../src/error')

    expect(document.getElementById('error-message')?.textContent).toContain(
      'Request timed out',
    )
    expect(document.getElementById('error-subtitle')?.textContent).toContain(
      'FEWS PI Web Services',
    )
    expect(document.getElementById('fews-pi-checks')?.hidden).toBe(false)
    expect(document.getElementById('application-config-checks')?.hidden).toBe(
      true,
    )
  })

  it('replaces stale FEWS PI context when application configuration fails', async () => {
    sessionStorage.setItem(CONFIG_ERROR_SOURCE_STORAGE_KEY, 'fews-pi')
    const error = await runStartupStage(
      'application-config',
      'Load application configuration',
      () => {
        throw new TypeError('Failed to fetch')
      },
    ).catch((reason: unknown) => reason)
    handleStartupError(error)
    expect(sessionStorage.getItem(CONFIG_ERROR_STORAGE_KEY)).toBe(
      'Failed to fetch',
    )
    await import('../../../src/error')

    expect(document.getElementById('fews-pi-checks')?.hidden).toBe(true)
    expect(document.getElementById('application-config-checks')?.hidden).toBe(
      false,
    )
  })

  it('shows neutral deployment checks when no source is stored', async () => {
    await import('../../../src/error')
    expect(document.getElementById('application-config-checks')?.hidden).toBe(
      true,
    )
    expect(document.getElementById('fews-pi-checks')?.hidden).toBe(true)
    expect(document.getElementById('unexpected-checks')?.hidden).toBe(false)
  })

  it.each([
    ['application-config', 'Application configuration unavailable'],
    ['fews-pi', 'Cannot connect to FEWS Web Services'],
    ['authentication', 'Unable to access FEWS Web Services'],
    ['microfrontends', 'Unable to initialize application modules'],
    ['unexpected', 'Web OC could not start'],
  ] as const)(
    'renders %s heading and only its checks',
    async (category, title) => {
      handleStartupError(
        new StartupError('Details', category, 'Test stage', undefined, 503),
      )
      await import('../../../src/error')
      expect(document.getElementById('error-title')?.textContent).toBe(title)
      expect(document.title).toContain(title)
      const visibleChecks = document.querySelectorAll(
        '.troubleshooting ol:not([hidden])',
      )
      expect(visibleChecks).toHaveLength(1)
      expect(visibleChecks[0].id).toBe(`${category}-checks`)
      expect(document.getElementById('error-context')?.textContent).toBe(
        'Startup stage: Test stage | HTTP 503',
      )
      expect(
        JSON.parse(sessionStorage.getItem(CONFIG_ERROR_CONTEXT_STORAGE_KEY)!),
      ).toMatchObject({
        category,
        stage: 'Test stage',
        message: 'Details',
        status: 503,
      })
    },
  )

  it.each([401, 403])(
    'classifies confirmed HTTP %s as an access failure',
    async (status) => {
      const cause = Object.assign(new Error('Access denied'), {
        response: { status },
      })
      handleStartupError(new FewsConfigLoadError(cause))
      await import('../../../src/error')
      expect(document.getElementById('authentication-checks')?.hidden).toBe(
        false,
      )
      expect(document.getElementById('error-context')?.textContent).toContain(
        `HTTP ${status}`,
      )
    },
  )

  it('uses the application base path for Retry and configuration links', async () => {
    vi.stubEnv('BASE_URL', '/weboc/')
    window.history.replaceState(null, '', '/weboc/error/')
    try {
      await import('../../../src/error')
      expect(document.getElementById('retry-link')?.getAttribute('href')).toBe(
        '/weboc/',
      )
      expect(
        document.getElementById('app-config-link')?.getAttribute('href'),
      ).toBe('/weboc/app-config.json')
    } finally {
      vi.unstubAllEnvs()
    }
  })

  it('preserves successfully loaded configuration', async () => {
    getWebOcConfiguration.mockResolvedValueOnce({
      general: { title: 'WebOC' },
      components: [],
    })
    await expect(getFewsConfig()).resolves.toEqual({
      general: { title: 'WebOC' },
      webOcComponents: [],
    })
  })
})
