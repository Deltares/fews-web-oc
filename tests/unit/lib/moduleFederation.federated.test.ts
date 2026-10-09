import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  buildType,
  initializeModuleFederation,
  isModuleFederationSupported,
  loadRemote,
} from '../../../src/lib/moduleFederation/index'
import {
  loadRemote as runtimeLoadRemote,
  registerRemotes,
} from '@module-federation/enhanced/runtime'
import { PiWebserviceProvider } from '@deltares/fews-pi-requests'

const { getMicroFrontEnds } = vi.hoisted(() => ({
  getMicroFrontEnds: vi.fn(),
}))

vi.mock('@module-federation/enhanced/runtime', () => ({
  registerRemotes: vi.fn(),
  loadRemote: vi.fn(),
}))
vi.mock('../../../src/lib/requests/transformRequest', () => ({
  createTransformRequestFn: () => undefined,
}))
vi.mock('@deltares/fews-pi-requests', () => ({
  PiWebserviceProvider: vi.fn(function () {
    return { getMicroFrontEnds }
  }),
}))

afterEach(() => {
  vi.clearAllMocks()
  vi.unstubAllGlobals()
})

describe('federated Module Federation adapter', () => {
  it('preserves manifest registration and microfrontend configuration', async () => {
    const remotes = [{ name: 'example', entry: 'https://example.com/entry.js' }]
    const config = { microFrontEnds: [] }
    const options = {
      manifestUrl: 'https://example.com/mf-manifest.json',
      baseUrl: 'https://example.com/FewsWebServices',
    }
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ remotes }), { status: 200 }),
      )
    vi.stubGlobal('fetch', fetchMock)
    getMicroFrontEnds.mockResolvedValue(config)

    expect(isModuleFederationSupported).toBe(true)
    expect(buildType).toBe('Micro Frontends')
    expect(await initializeModuleFederation(options)).toEqual({
      config,
      options,
      remotes,
    })
    expect(fetchMock).toHaveBeenCalledWith(options.manifestUrl)
    expect(registerRemotes).toHaveBeenCalledWith(remotes)
    expect(PiWebserviceProvider).toHaveBeenCalledWith(options.baseUrl, {
      transformRequestFn: undefined,
    })
    expect(getMicroFrontEnds).toHaveBeenCalledWith({})
  })

  it('preserves the runtime loader', async () => {
    const component = { default: {} }
    vi.mocked(runtimeLoadRemote).mockResolvedValue(component)
    expect(await loadRemote('example/component')).toBe(component)
    expect(runtimeLoadRemote).toHaveBeenCalledWith('example/component')
  })

  it('rejects failed manifest requests before registering remotes', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(null, { status: 503 })),
    )
    await expect(
      initializeModuleFederation({
        manifestUrl: 'https://example.com/mf-manifest.json',
        baseUrl: 'https://example.com',
      }),
    ).rejects.toThrow('Failed to fetch manifest')
    expect(registerRemotes).not.toHaveBeenCalled()
    expect(getMicroFrontEnds).not.toHaveBeenCalled()
  })
})
