// @vitest-environment jsdom
import { createApp, defineComponent, h, nextTick } from 'vue'
import { LngLatBounds, type Map } from 'maplibre-gl'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  provideMapSync,
  useMapSync,
  useSynchronizedMapBounds,
} from '@/services/useMapSync'

const mounts: Array<ReturnType<typeof createApp>> = []

function createMap(bounds?: LngLatBounds) {
  return {
    getBounds: vi.fn(() => bounds),
    on: vi.fn(),
    off: vi.fn(),
  } as unknown as Map
}

afterEach(() => {
  mounts.splice(0).forEach((app) => app.unmount())
})

describe('useMapSync', () => {
  it('returns the active bounds while excluding the screenshot preview map', async () => {
    const bounds = new LngLatBounds([1, 2], [3, 4])
    const currentMap = createMap(bounds)
    const newMap = createMap()
    let getSynchronizedMapBounds:
      ReturnType<typeof useSynchronizedMapBounds> | undefined
    const SyncMap = defineComponent({
      setup() {
        useMapSync(currentMap)
        return () => h('div')
      },
    })
    const SyncGroup = defineComponent({
      setup() {
        getSynchronizedMapBounds = useSynchronizedMapBounds()
        return () => h(SyncMap)
      },
    })
    const host = document.createElement('div')
    const app = createApp(
      defineComponent({
        setup() {
          provideMapSync()
          return () => h(SyncGroup)
        },
      }),
    )
    mounts.push(app)
    app.mount(host)
    await nextTick()

    expect(getSynchronizedMapBounds?.(newMap)).toBe(bounds)
    expect(getSynchronizedMapBounds?.(currentMap)).toBeUndefined()
  })
})
