// @vitest-environment jsdom
import { createPinia, setActivePinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { createApp, nextTick } from 'vue'
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

describe('userSettings store – persistence', () => {
  function createStore() {
    const pinia = createPinia()
    pinia.use(piniaPluginPersistedstate)
    // Pinia only applies plugins once installed in an app.
    createApp({}).use(pinia)
    setActivePinia(pinia)
    return useUserSettingsStore()
  }

  function storedItems() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}').items
  }

  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('saves only the settings the user changed', async () => {
    mockFewsConfigFile(defaultUserSettingsJson)
    const store = createStore()
    await store.initializeWithWebResources()
    await nextTick()

    expect(storedItems()).toEqual([])

    const showCoordinates = store.get('ui.map.showCoordinates')!
    store.add({ ...showCoordinates, value: true } as typeof showCoordinates)
    const theme = store.get('ui.theme')!
    store.add({ ...theme, favorite: false })
    await nextTick()

    expect(storedItems()).toEqual([
      { id: 'ui.theme', favorite: false },
      { id: 'ui.map.showCoordinates', value: true },
    ])
  })

  it('restores saved changes when the store is created', () => {
    storeLocalSettings([{ id: 'ui.map.showCoordinates', value: true }])
    const store = createStore()

    expect(store.get('ui.map.showCoordinates')?.value).toBe(true)
  })

  it('applies a changed FEWS config default to a returning user', async () => {
    mockFewsConfigFile(defaultUserSettingsJson)
    const firstVisit = createStore()
    await firstVisit.initializeWithWebResources()
    await nextTick()
    expect(firstVisit.get('ui.theme')?.value).toBe('dark')

    mockFewsConfigFile({
      settings: [{ id: 'ui.theme', value: 'light' }],
    })
    const secondVisit = createStore()
    await secondVisit.initializeWithWebResources()

    expect(secondVisit.get('ui.theme')?.value).toBe('light')
  })

  it('clears saved changes on restoreDefaults', async () => {
    mockFewsConfigFile(defaultUserSettingsJson)
    storeLocalSettings([{ id: 'ui.map.showCoordinates', value: true }])
    const store = createStore()
    await store.initializeWithWebResources()

    store.restoreDefaults()
    await nextTick()

    expect(storedItems()).toEqual([])
  })
})
