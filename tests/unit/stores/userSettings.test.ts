// @vitest-environment jsdom
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useUserSettingsStore } from '@/stores/userSettings'

vi.mock('vue-router', () => ({
  useRoute: () => ({ query: {} }),
}))

vi.mock('@/lib/fews-config', () => ({
  getResourcesStaticUrl: (resource: string) =>
    `http://example.test/${resource}`,
}))

const STORAGE_KEY = 'weboc-user-settings-v1.0.0'

// Mocked FEWS config WebResourceFiles/default-user-settings.json
const defaultUserSettingsJson = {
  $schema: './default-user-settings.schema.json',
  settings: [
    { id: 'ui.theme', value: 'dark', favorite: true },
    { id: 'datum.verticalDatum', value: false },
    { id: 'charts.scrollZoomMode', value: 'y', enabled: false },
  ],
}

function mockFewsConfigFile(body: unknown, ok = true) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok,
    json: async () => body,
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function storeLocalSettings(items: unknown[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ items }))
}

describe('userSettings store – restoreDefaults', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('restores values from the FEWS config, discarding user changes', async () => {
    const fetchMock = mockFewsConfigFile(defaultUserSettingsJson)
    storeLocalSettings([
      { id: 'ui.theme', value: 'light', favorite: false },
      { id: 'ui.map.showCoordinates', value: true, favorite: true },
    ])

    const store = useUserSettingsStore()
    await store.initializeWithWebResources()

    expect(fetchMock).toHaveBeenCalledWith(
      'http://example.test/default-user-settings.json',
    )
    expect(store.get('ui.theme')?.value).toBe('light')
    expect(store.get('ui.map.showCoordinates')?.value).toBe(true)

    store.restoreDefaults()

    expect(store.get('ui.theme')?.value).toBe('dark')
    expect(store.get('ui.theme')?.favorite).toBe(true)
    expect(store.get('ui.map.showCoordinates')?.value).toBe(false)
    expect(store.get('ui.map.showCoordinates')?.favorite).toBeFalsy()
  })

  it('reapplies side effects of special settings', async () => {
    mockFewsConfigFile(defaultUserSettingsJson)
    storeLocalSettings([
      { id: 'datum.verticalDatum', value: true, favorite: false },
    ])

    const store = useUserSettingsStore()
    await store.initializeWithWebResources()
    expect(store.convertDatum).toBe(true)

    store.restoreDefaults()

    expect(store.get('datum.verticalDatum')?.value).toBe(false)
    expect(store.convertDatum).toBe(false)
  })

  it('keeps settings disabled in the FEWS config hidden', async () => {
    mockFewsConfigFile(defaultUserSettingsJson)

    const store = useUserSettingsStore()
    await store.initializeWithWebResources()
    store.restoreDefaults()

    const scrollZoomMode = store.get('charts.scrollZoomMode')
    expect(scrollZoomMode?.value).toBe('y')
    expect(scrollZoomMode?.disabled).toBe(true)
    expect(store.listByGroup('Charts').map((item) => item.id)).not.toContain(
      'charts.scrollZoomMode',
    )
  })

  it('keeps option lists that were updated at runtime', async () => {
    mockFewsConfigFile(defaultUserSettingsJson)

    const store = useUserSettingsStore()
    await store.initializeWithWebResources()

    const baseMaps = [
      { value: 'automatic', title: 'Automatic' },
      { value: 'osm', title: 'OpenStreetMap' },
    ]
    store.updateSettingItems('ui.map.theme', baseMaps)
    const mapTheme = store.get('ui.map.theme')
    if (mapTheme?.type === 'oneOfMultiple') {
      store.add({ ...mapTheme, value: 'osm' })
    }

    store.restoreDefaults()

    const restored = store.get('ui.map.theme')
    expect(restored?.value).toBe('automatic')
    expect(restored?.type === 'oneOfMultiple' && restored.items).toEqual(
      baseMaps,
    )
  })

  it('falls back to the built-in defaults without a FEWS config file', async () => {
    mockFewsConfigFile({}, false)
    storeLocalSettings([{ id: 'ui.theme', value: 'light', favorite: true }])

    const store = useUserSettingsStore()
    await store.initializeWithWebResources()
    store.restoreDefaults()

    expect(store.get('ui.theme')?.value).toBe('auto')
    expect(store.get('ui.theme')?.favorite).toBeFalsy()
    expect(store.get('charts.scrollZoomMode')?.value).toBe('x')
    expect(store.get('charts.scrollZoomMode')?.disabled).toBeFalsy()
  })
})
