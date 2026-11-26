// @vitest-environment jsdom
import { createApp, defineComponent, h, nextTick, ref } from 'vue'
import { LngLatBounds, type Map } from 'maplibre-gl'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { provideMapSync, useMapSync } from '@/services/useMapSync'

const mounts: Array<ReturnType<typeof createApp>> = []

function createMap(bounds?: LngLatBounds) {
  return {
    fitBounds: vi.fn(),
    getBounds: vi.fn(() => bounds),
    on: vi.fn(),
    off: vi.fn(),
  } as unknown as Map
}

afterEach(() => {
  mounts.splice(0).forEach((app) => app.unmount())
})

describe('useMapSync', () => {
  it('applies the current bounds to a map joining the synchronization group', async () => {
    const bounds = new LngLatBounds([1, 2], [3, 4])
    const currentMap = createMap(bounds)
    const newMap = createMap()
    const showNewMap = ref(false)
    const SyncMap = defineComponent({
      props: {
        map: { type: Object, required: true },
      },
      setup(props) {
        useMapSync(props.map as Map)
        return () => h('div')
      },
    })
    const host = document.createElement('div')
    const app = createApp(
      defineComponent({
        setup() {
          provideMapSync()
          return () =>
            h('div', [
              h(SyncMap, { map: currentMap }),
              showNewMap.value ? h(SyncMap, { map: newMap }) : undefined,
            ])
        },
      }),
    )
    mounts.push(app)
    app.mount(host)
    await nextTick()

    showNewMap.value = true
    await nextTick()

    expect(newMap.fitBounds).toHaveBeenCalledWith(bounds, { animate: false })
  })
})
