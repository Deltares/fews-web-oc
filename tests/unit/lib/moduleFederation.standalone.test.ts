import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  buildType,
  initializeModuleFederation,
  isModuleFederationSupported,
  loadRemote,
  unsupportedMicroFrontendMessage,
} from '../../../src/lib/moduleFederation/standalone'
import { useMicroFrontEnd } from '../../../src/composables/useMicroFrontEnd'
import {
  nodeHasMF,
  topologyNodeIsVisible,
} from '../../../src/lib/topology/nodes'

vi.mock(
  '@weboc/module-federation',
  () => import('../../../src/lib/moduleFederation/standalone'),
)
vi.mock('vue', async (importOriginal) => ({
  ...(await importOriginal<typeof import('vue')>()),
  inject: vi.fn(() => null),
}))

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('standalone Module Federation adapter', () => {
  it('ignores configured manifests with a warning and no requests', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {})

    expect(isModuleFederationSupported).toBe(false)
    expect(buildType).toBe('')
    expect(
      await initializeModuleFederation({
        manifestUrl: 'https://example.com/mf-manifest.json',
        baseUrl: 'https://example.com/FewsWebServices',
      }),
    ).toBeNull()
    expect(warning).toHaveBeenCalledWith(
      expect.stringContaining('VITE_FEWS_WEBOC_MF_MANIFEST_URL is ignored.'),
    )
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('rejects remote loading explicitly', async () => {
    await expect(loadRemote('remote/component')).rejects.toThrow(
      unsupportedMicroFrontendMessage,
    )
  })

  it('disables the registry and reports unsupported display loading', async () => {
    const frontend = useMicroFrontEnd()
    expect(frontend.isSupported).toBe(false)
    expect(frontend.isEnabled).toBe(false)
    expect(frontend.microFrontEndConfig()).toEqual([])
    expect(frontend.getRemotes()).toEqual([])
    await expect(frontend.loadWebOCRemote('example')).rejects.toThrow(
      unsupportedMicroFrontendMessage,
    )
  })

  it('hides remote-only nodes but preserves ordinary displays', () => {
    const node = {
      id: 'remote-node',
      name: 'Remote',
      microFrontEnds: [{ id: 'example' }],
    }
    expect(nodeHasMF(node)).toBe(false)
    expect(topologyNodeIsVisible(node)).toBe(false)
    expect(topologyNodeIsVisible({ ...node, displayId: 'chart' })).toBe(true)
  })
})
