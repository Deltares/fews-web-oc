// @vitest-environment jsdom
import { createPinia, setActivePinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { createApp, nextTick } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useUserSettingsStore } from '@/stores/userSettings'
import { useConfiguratorModeStore } from '@/stores/configuratorMode'

const route = vi.hoisted(() => ({ query: {} as Record<string, string> }))
vi.mock('vue-router', () => ({ useRoute: () => route }))

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

function storedItems() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}').items
}

describe('userSettings store – restoreDefaults', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    route.query = {}
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('defaults to v4 without color contrast while hiding both settings', () => {
    const store = useUserSettingsStore()

    expect(store.chartEngine).toBe('v4')
    expect(store.chartColorContrast).toBe('none')
    const chartSettings = store.listByGroup('Charts').map((item) => item.id)
    expect(chartSettings).not.toContain('charts.engine')
    expect(chartSettings).not.toContain('charts.colorContrast')
  })

  it('lets the FEWS config enable v5 and color contrast', async () => {
    mockFewsConfigFile({
      settings: [
        { id: 'charts.engine', value: 'v5', enabled: true },
        { id: 'charts.colorContrast', value: 'auto', enabled: true },
      ],
    })

    const store = useUserSettingsStore()
    await store.initializeWithWebResources()

    expect(store.chartEngine).toBe('v5')
    expect(store.chartColorContrast).toBe('auto')
    const chartSettings = store.listByGroup('Charts').map((item) => item.id)
    expect(chartSettings).toContain('charts.engine')
    expect(chartSettings).toContain('charts.colorContrast')
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
      { cache: 'no-cache' },
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

describe('userSettings store – configurator mode', () => {
  function createStore() {
    const pinia = createPinia()
    pinia.use(piniaPluginPersistedstate)
    createApp({}).use(pinia)
    setActivePinia(pinia)
    return useUserSettingsStore()
  }

  beforeEach(() => {
    vi.stubEnv('DEV', true)
    localStorage.clear()
    route.query = {}
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('shows, edits, and resets disabled boolean and one-of settings', async () => {
    mockFewsConfigFile({
      settings: [
        {
          id: 'datum.verticalDatum',
          value: false,
          enabled: false,
          favorite: true,
        },
        {
          id: 'charts.scrollZoomMode',
          value: 'y',
          enabled: false,
          favorite: false,
        },
      ],
    })
    const store = createStore()
    await store.initializeWithWebResources()
    const configuratorMode = useConfiguratorModeStore()

    expect(store.listByGroup('Datum')).not.toContainEqual(
      expect.objectContaining({ id: 'datum.verticalDatum' }),
    )
    expect(store.listByGroup('Charts')).not.toContainEqual(
      expect.objectContaining({ id: 'charts.scrollZoomMode' }),
    )

    configuratorMode.setEnabled(true)
    expect(store.listByGroup('Datum')).toContainEqual(
      expect.objectContaining({ id: 'datum.verticalDatum' }),
    )
    expect(store.listByGroup('Charts')).toContainEqual(
      expect.objectContaining({ id: 'charts.scrollZoomMode' }),
    )

    const verticalDatum = store.get('datum.verticalDatum')!
    store.add({ ...verticalDatum, value: true, favorite: false })
    const scrollZoomMode = store.get('charts.scrollZoomMode')!
    store.add({ ...scrollZoomMode, value: 'xy', favorite: true })
    await nextTick()

    expect(store.convertDatum).toBe(true)
    expect(store.get('charts.scrollZoomMode')?.value).toBe('xy')
    expect(storedItems()).toEqual([])

    configuratorMode.setEnabled(false)

    expect(store.get('datum.verticalDatum')).toMatchObject({
      value: false,
      favorite: true,
    })
    expect(store.convertDatum).toBe(false)
    expect(store.get('charts.scrollZoomMode')).toMatchObject({
      value: 'y',
      favorite: false,
    })
    expect(store.listByGroup('Datum')).not.toContainEqual(
      expect.objectContaining({ id: 'datum.verticalDatum' }),
    )
  })

  it('does not apply route query overrides to disabled settings', async () => {
    mockFewsConfigFile({
      settings: [{ id: 'datum.verticalDatum', value: false, enabled: false }],
    })
    route.query['datum.verticalDatum'] = 'true'
    const store = createStore()
    await store.initializeWithWebResources()
    const configuratorMode = useConfiguratorModeStore()

    configuratorMode.setEnabled(true)
    const verticalDatum = store.get('datum.verticalDatum')!
    store.add({ ...verticalDatum, value: true })

    expect(store.get('datum.verticalDatum')?.value).toBe(true)

    configuratorMode.setEnabled(false)
    expect(store.get('datum.verticalDatum')?.value).toBe(false)
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

describe('userSettings store – locale setting', () => {
  function uiSettingIds(store: ReturnType<typeof useUserSettingsStore>) {
    return store.listByGroup('UI').map((item) => item.id)
  }

  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('is hidden and ignores stored values by default', async () => {
    mockFewsConfigFile({ settings: [] })
    storeLocalSettings([{ id: 'ui.locale', value: 'de' }])

    const store = useUserSettingsStore()
    await store.initializeWithWebResources()

    expect(uiSettingIds(store)).not.toContain('ui.locale')
    expect(store.get('ui.locale')?.value).toBe('default')
  })

  it('becomes visible and user-editable when enabled in the FEWS config', async () => {
    mockFewsConfigFile({ settings: [{ id: 'ui.locale', enabled: true }] })
    storeLocalSettings([{ id: 'ui.locale', value: 'de' }])

    const store = useUserSettingsStore()
    await store.initializeWithWebResources()

    expect(uiSettingIds(store)).toContain('ui.locale')
    expect(store.get('ui.locale')?.value).toBe('de')
  })

  it('can be fixed to a language by the FEWS config while hidden', async () => {
    mockFewsConfigFile({ settings: [{ id: 'ui.locale', value: 'de' }] })

    const store = useUserSettingsStore()
    await store.initializeWithWebResources()

    expect(uiSettingIds(store)).not.toContain('ui.locale')
    expect(store.get('ui.locale')?.value).toBe('de')
  })
})

describe('userSettings store – settings enabled by the FEWS config', () => {
  function createStore() {
    const pinia = createPinia()
    pinia.use(piniaPluginPersistedstate)
    // Pinia only applies plugins once installed in an app.
    createApp({}).use(pinia)
    setActivePinia(pinia)
    return useUserSettingsStore()
  }

  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('keeps the saved choice when settings change before the config is loaded', async () => {
    mockFewsConfigFile({
      settings: [{ id: 'ui.locale', value: 'default', enabled: true }],
    })
    storeLocalSettings([{ id: 'ui.locale', value: 'de' }])

    const store = createStore()
    // e.g. base maps arriving from the map layer config
    store.updateSettingItems('ui.map.theme', [
      { value: 'automatic', title: 'Automatic' },
    ])
    await nextTick()

    await store.initializeWithWebResources()

    expect(store.get('ui.locale')?.disabled).toBe(false)
    expect(store.get('ui.locale')?.value).toBe('de')
  })
})

describe('userSettings store – base maps from the map layer config', () => {
  const baseMaps = [
    { value: 'automatic', title: 'Automatic' },
    { value: 'light', title: 'Light' },
    { value: 'dark', title: 'Dark' },
    { value: 'osm', title: 'OpenStreetMap' },
  ]

  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('keeps base maps that arrive before the FEWS config file', async () => {
    mockFewsConfigFile(defaultUserSettingsJson)

    const store = useUserSettingsStore()
    store.updateSettingItems('ui.map.theme', baseMaps)
    await store.initializeWithWebResources()

    const mapTheme = store.get('ui.map.theme')
    expect(mapTheme?.type === 'oneOfMultiple' && mapTheme.items).toEqual(
      baseMaps,
    )
  })

  it('restores a saved base map that arrives before the FEWS config file', async () => {
    mockFewsConfigFile(defaultUserSettingsJson)
    storeLocalSettings([{ id: 'ui.map.theme', value: 'osm' }])

    const store = useUserSettingsStore()
    store.updateSettingItems('ui.map.theme', baseMaps)
    await store.initializeWithWebResources()

    expect(store.get('ui.map.theme')?.value).toBe('osm')
  })

  it('restores a saved base map that arrives after the FEWS config file', async () => {
    mockFewsConfigFile(defaultUserSettingsJson)
    storeLocalSettings([{ id: 'ui.map.theme', value: 'osm' }])

    const store = useUserSettingsStore()
    await store.initializeWithWebResources()
    store.updateSettingItems('ui.map.theme', baseMaps)

    expect(store.get('ui.map.theme')?.value).toBe('osm')
  })
})
