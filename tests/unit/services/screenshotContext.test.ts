// @vitest-environment jsdom
import { createApp, defineComponent, h, nextTick, ref } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useWmsLayerCapabilities } from '@/services/useWms'
import {
  provideSelectedDate,
  useSelectedDate,
} from '@/services/useSelectedDate'

const { getCapabilities } = vi.hoisted(() => ({ getCapabilities: vi.fn() }))
vi.mock('@deltares/fews-wms-requests', () => ({
  WMSProvider: vi.fn(function () {
    return { getCapabilities }
  }),
}))
vi.mock('@/lib/requests/transformRequest', () => ({
  createTransformRequestFn: vi.fn(),
}))
vi.mock('@/services/useRefreshCoordinator', () => ({
  useRefreshCoordinator: vi.fn(),
}))

afterEach(() => vi.clearAllMocks())

describe('independent screenshot context', () => {
  it('fetches the preview layer instead of inheriting the parent layer and its times', async () => {
    getCapabilities.mockImplementation(
      async ({ layers }: { layers: string }) => ({
        layers: [
          {
            name: layers,
            times:
              layers === 'parent'
                ? ['2026-01-01T00:00:00Z']
                : ['2026-02-01T00:00:00Z'],
          },
        ],
      }),
    )
    const layer = ref('preview-one')
    let preview: ReturnType<typeof useWmsLayerCapabilities> | undefined
    let child: ReturnType<typeof useWmsLayerCapabilities> | undefined
    let parent: ReturnType<typeof useWmsLayerCapabilities> | undefined
    const Descendant = defineComponent({
      setup() {
        child = useWmsLayerCapabilities('http://fews', 'unused', undefined)
        return () => null
      },
    })
    const Preview = defineComponent({
      setup() {
        preview = useWmsLayerCapabilities(
          'http://fews',
          layer,
          undefined,
          false,
        )
        return () => h(Descendant)
      },
    })
    const app = createApp({
      setup() {
        parent = useWmsLayerCapabilities('http://fews', 'parent', undefined)
        return () => h(Preview)
      },
    })
    app.mount(document.createElement('div'))
    try {
      await vi.waitFor(() =>
        expect(preview?.layerCapabilities.value?.name).toBe('preview-one'),
      )
      expect(child).toBe(preview)
      expect(preview).not.toBe(parent)
      expect(preview?.times.value).toEqual([new Date('2026-02-01T00:00:00Z')])
      layer.value = 'preview-two'
      await vi.waitFor(() =>
        expect(preview?.layerCapabilities.value?.name).toBe('preview-two'),
      )
      expect(parent?.layerCapabilities.value?.name).toBe('parent')
    } finally {
      app.unmount()
    }
  })

  it('uses the preview slider date without changing the parent selected date', async () => {
    const parentDate = ref(new Date('2026-01-01T00:00:00Z'))
    const previewDate = ref(new Date('2026-02-01T00:00:00Z'))
    let date: ReturnType<typeof useSelectedDate> | undefined
    const Preview = defineComponent({
      setup() {
        date = useSelectedDate(previewDate, false)
        return () => null
      },
    })
    const app = createApp({
      setup() {
        provideSelectedDate(parentDate)
        return () => h(Preview)
      },
    })
    app.mount(document.createElement('div'))
    try {
      expect(date?.selectedDate.value).toEqual(previewDate.value)
      expect(date?.dateTimeSliderEnabled.value).toBe(true)
      previewDate.value = new Date('2026-03-01T00:00:00Z')
      await nextTick()
      expect(date?.selectedDate.value).toEqual(previewDate.value)
      expect(parentDate.value).toEqual(new Date('2026-01-01T00:00:00Z'))
    } finally {
      app.unmount()
    }
  })
})
