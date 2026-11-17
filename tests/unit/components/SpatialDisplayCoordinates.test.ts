// @vitest-environment jsdom
import { createApp, defineComponent, h, ref, type App } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import SpatialDisplay from '@/components/spatialdisplay/SpatialDisplay.vue'

const onlyGrids = ref(true)

vi.mock('vuetify/lib/components/VBtn/index.mjs', () => ({
  VBtn: defineComponent({ template: '<button><slot /></button>' }),
}))
vi.mock('@/components/spatialdisplay/SpatialDisplayComponent.vue', () => ({
  default: defineComponent({
    emits: ['coordinateClick'],
    setup(_props, { emit }) {
      return () =>
        h(
          'button',
          { onClick: () => emit('coordinateClick', -29.123456, 32.08) },
          'Select coordinate',
        )
    },
  }),
}))
vi.mock('@/services/application-config', () => ({
  configManager: { get: () => '' },
}))
vi.mock('@/services/useWms', () => ({
  useWmsLayerCapabilities: () => ({
    layerCapabilities: ref({ onlyGrids: onlyGrids.value }),
    times: ref([]),
  }),
}))
vi.mock('@/services/useFilterLocations', () => ({
  useFilterLocations: () => ({
    locations: ref([]),
    geojson: ref({ type: 'FeatureCollection', features: [] }),
  }),
}))
vi.mock('@/stores/userSettings', () => ({
  useUserSettingsStore: () => ({ get: () => undefined }),
}))
vi.mock('@/stores/warningLevels', () => ({
  useWarningLevelsStore: () => ({
    selectedCrossings: [],
    selectedWarningLevels: [],
    selectedWarningLevelIds: [],
  }),
}))
vi.mock('@/stores/locationNames', () => ({
  useLocationNamesStore: () => ({ addLocationNames: vi.fn() }),
}))
vi.mock('@deltares/fews-web-oc-composables', () => ({
  useDateRegistry: vi.fn(),
}))

describe('SpatialDisplay coordinate navigation', () => {
  let app: App | undefined

  afterEach(() => {
    app?.unmount()
    app = undefined
    onlyGrids.value = true
  })

  it('navigates with both coordinates rounded to five decimal places', () => {
    const navigate = vi.fn()
    const container = document.createElement('div')
    app = createApp(SpatialDisplay, { onNavigate: navigate })
    app.mount(container)

    container.querySelector('button')!.click()

    expect(navigate).toHaveBeenCalledOnce()
    expect(navigate).toHaveBeenCalledWith({
      name: 'SpatialDisplayWithCoordinates',
      params: { latitude: '-29.12346', longitude: '32.08000' },
    })
  })

  it('does not navigate when the layer does not support coordinates', () => {
    onlyGrids.value = false
    const navigate = vi.fn()
    const container = document.createElement('div')
    app = createApp(SpatialDisplay, { onNavigate: navigate })
    app.mount(container)

    container.querySelector('button')!.click()

    expect(navigate).not.toHaveBeenCalled()
  })
})
