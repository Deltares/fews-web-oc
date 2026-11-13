// @vitest-environment jsdom
import { createApp, defineComponent, h, nextTick, onMounted, ref } from 'vue'
import { createI18n } from 'vue-i18n'
import { afterEach, describe, expect, it, vi } from 'vitest'
import NodeScreenshotDialog from '@/components/reports/dynamic/NodeScreenshotDialog.vue'
import { captureNodeScreenshot } from '@/lib/dynamic-report/screenshot'
import { getLayerNameForNode } from '@/lib/topology/displayTabs'
import { getDefaultSettings } from '@/lib/topology/componentSettings'
import { fetchAndInlineCssAndFonts } from '@/lib/css/inline'

const fakeMap = { name: 'map' }
vi.mock('@/lib/dynamic-report/screenshot', () => ({
  captureNodeScreenshot: vi.fn(),
}))
vi.mock('@/lib/topology/displayTabs', () => ({
  getLayerNameForNode: vi.fn(async () => 'layer'),
}))
vi.mock('@/stores/config', () => ({
  useConfigStore: () => ({ getCustomStyleSheet: async () => 'test.css' }),
}))
vi.mock('@/lib/css/inline', () => ({
  fetchAndInlineCssAndFonts: vi.fn(async () => 'chart css'),
}))
vi.mock('@/stores/topologyNodes', () => ({
  useTopologyNodesStore: () => ({
    nodes: [
      { id: 'one', name: 'First', gridDisplaySelection: { plotId: 'layer' } },
      { id: 'two', name: 'Second', filterIds: ['filter'] },
    ],
  }),
}))
vi.mock('@/components/spatialdisplay/SpatialDisplay.vue', () => ({
  default: defineComponent({
    emits: ['navigate'],
    setup(_props, { slots, emit }) {
      return () =>
        h('div', [
          slots.map?.(),
          h(
            'button',
            {
              onClick: () => emit('navigate', { params: { locationIds: 'x' } }),
            },
            'Select location',
          ),
          h('div', { class: 'chart-container' }, [h('svg')]),
        ])
    },
  }),
}))
vi.mock('@/components/map/MapCaptureTarget.vue', () => ({
  default: defineComponent({
    emits: ['change'],
    setup(_props, { emit }) {
      onMounted(() => emit('change', fakeMap))
      return () => h('div')
    },
  }),
}))
vi.mock('vuetify/lib/components/VDialog/index.mjs', () => ({
  VDialog: defineComponent({
    setup:
      (_props, { slots }) =>
      () =>
        h('div', slots.default?.()),
  }),
}))
vi.mock('vuetify/lib/components/VCard/index.mjs', () => ({
  VCard: defineComponent({
    setup:
      (_props, { slots }) =>
      () =>
        h('div', slots.default?.()),
  }),
  VCardTitle: defineComponent({
    setup:
      (_props, { slots }) =>
      () =>
        h('div', slots.default?.()),
  }),
  VCardText: defineComponent({
    setup:
      (_props, { slots }) =>
      () =>
        h('div', slots.default?.()),
  }),
  VCardActions: defineComponent({
    setup:
      (_props, { slots }) =>
      () =>
        h('div', slots.default?.()),
  }),
}))
vi.mock('vuetify/lib/components/VBtn/index.mjs', () => ({
  VBtn: defineComponent({
    setup:
      (_props, { slots, attrs }) =>
      () =>
        h('button', attrs, slots.default?.()),
  }),
}))
vi.mock('vuetify/lib/components/VAutocomplete/index.mjs', () => ({
  VAutocomplete: defineComponent({
    props: ['items', 'modelValue'],
    emits: ['update:modelValue'],
    setup(props, { emit }) {
      return () =>
        h(
          'select',
          {
            value: props.modelValue,
            onChange: (event: Event) =>
              emit(
                'update:modelValue',
                (event.target as HTMLSelectElement).value,
              ),
          },
          props.items.map((item: { id: string; name: string }) =>
            h('option', { value: item.id }, item.name),
          ),
        )
    },
  }),
}))
vi.mock('vuetify/lib/components/VSelect/index.mjs', () => ({
  VSelect: defineComponent({
    props: ['items', 'modelValue', 'disabled', 'label'],
    emits: ['update:modelValue'],
    setup(props, { emit }) {
      return () =>
        h(
          'select',
          {
            'aria-label': props.label,
            value: props.modelValue,
            disabled: props.disabled,
            onChange: (event: Event) =>
              emit(
                'update:modelValue',
                Number((event.target as HTMLSelectElement).value),
              ),
          },
          props.items.map((item: { title: string; value: number }) =>
            h('option', { value: item.value }, item.title),
          ),
        )
    },
  }),
}))
vi.mock('vuetify/lib/components/VAlert/index.mjs', () => ({
  VAlert: defineComponent({
    setup:
      (_props, { slots }) =>
      () =>
        h('div', slots.default?.()),
  }),
}))
vi.mock('vuetify/lib/components/VGrid/index.mjs', () => ({
  VSpacer: defineComponent({ setup: () => () => h('div') }),
}))

afterEach(() => vi.clearAllMocks())

function mountDialog() {
  const open = ref(false)
  const captured = vi.fn()
  const host = document.createElement('div')
  const app = createApp({
    render: () =>
      h(NodeScreenshotDialog, {
        modelValue: open.value,
        'onUpdate:modelValue': (value: boolean) => {
          open.value = value
        },
        settings: getDefaultSettings(),
        initialNodeId: 'two',
        onCapture: captured,
      }),
  })
  app.use(
    createI18n({
      legacy: false,
      locale: 'en',
      messages: {
        en: {
          common: { cancel: 'Cancel' },
          dynamicReport: {
            screenshotTitle: 'Capture',
            selectNode: 'Node',
            screenshotSize: 'Screenshot size',
            screenshotSizeSmall: 'Small (640 px)',
            screenshotSizeMedium: 'Medium (1280 px)',
            screenshotSizeLarge: 'Large (1920 px)',
            addScreenshot: 'Add',
            screenshotMapFailed: 'Map failed',
            screenshotCaptureFailed: 'Capture failed',
          },
        },
      },
    }),
  )
  app.mount(host)
  open.value = true
  const addButton = () =>
    Array.from(host.querySelectorAll('button')).find(
      (button) => button.textContent === 'Add',
    )!
  return { app, open, captured, host, addButton }
}

describe('node screenshot dialog', () => {
  it('captures the selected node map and closes after success', async () => {
    const blob = new Blob(['map'], { type: 'image/png' })
    vi.mocked(captureNodeScreenshot).mockResolvedValue(blob)
    const { app, open, captured, host, addButton } = mountDialog()
    try {
      await vi.waitFor(() =>
        expect(host.querySelector('select')?.value).toBe('two'),
      )
      await vi.waitFor(() => expect(getLayerNameForNode).toHaveBeenCalled())
      await nextTick()
      const add = addButton()
      await vi.waitFor(() => expect(add.disabled).toBe(false))
      add.click()
      await vi.waitFor(() =>
        expect(captured).toHaveBeenCalledWith(blob, 'Second'),
      )
      expect(captureNodeScreenshot).toHaveBeenCalledWith(fakeMap, {
        chart: undefined,
        maxDimension: 1280,
      })
      expect(open.value).toBe(false)
    } finally {
      app.unmount()
    }
  })

  it.each([640, 1280, 1920])(
    'captures with the selected %i pixel size limit',
    async (size) => {
      const blob = new Blob(['map'], { type: 'image/png' })
      vi.mocked(captureNodeScreenshot).mockResolvedValueOnce(blob)
      const { app, captured, host, addButton } = mountDialog()
      try {
        await vi.waitFor(() => expect(addButton().disabled).toBe(false))
        const select = host.querySelector<HTMLSelectElement>(
          'select[aria-label="Screenshot size"]',
        )!
        expect(Array.from(select.options, (option) => option.value)).toEqual([
          '640',
          '1280',
          '1920',
        ])
        select.value = String(size)
        select.dispatchEvent(new Event('change'))
        await nextTick()
        addButton().click()
        await vi.waitFor(() => expect(captured).toHaveBeenCalled())
        expect(captureNodeScreenshot).toHaveBeenCalledWith(fakeMap, {
          chart: undefined,
          maxDimension: size,
        })
      } finally {
        app.unmount()
      }
    },
  )

  it('discards a capture if the selected node changes before it completes', async () => {
    let finish!: (image: Blob) => void
    vi.mocked(captureNodeScreenshot).mockReturnValueOnce(
      new Promise((resolve) => {
        finish = resolve
      }),
    )
    const { app, open, captured, host, addButton } = mountDialog()
    try {
      await vi.waitFor(() => expect(addButton().disabled).toBe(false))
      addButton().click()
      await vi.waitFor(() => expect(captureNodeScreenshot).toHaveBeenCalled())
      const select = host.querySelector('select')!
      select.value = 'one'
      select.dispatchEvent(new Event('change'))
      finish(new Blob(['map'], { type: 'image/png' }))
      await vi.waitFor(() => expect(addButton().disabled).toBe(false))
      expect(captured).not.toHaveBeenCalled()
      expect(open.value).toBe(true)
    } finally {
      app.unmount()
    }
  })

  it('shows capture failures without closing the dialog', async () => {
    vi.mocked(captureNodeScreenshot).mockRejectedValueOnce(
      new Error('Map not ready'),
    )
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { app, open, captured, host, addButton } = mountDialog()
    try {
      await vi.waitFor(() => expect(addButton().disabled).toBe(false))
      addButton().click()
      await vi.waitFor(() =>
        expect(host.textContent).toContain('Capture failed'),
      )
      expect(captured).not.toHaveBeenCalled()
      expect(open.value).toBe(true)
      expect(log).toHaveBeenCalled()
    } finally {
      app.unmount()
      log.mockRestore()
    }
  })

  it('includes the selected location chart in the capture', async () => {
    const blob = new Blob(['map and chart'], { type: 'image/png' })
    vi.mocked(captureNodeScreenshot).mockResolvedValueOnce(blob)
    const bounds = vi.spyOn(SVGElement.prototype, 'getBoundingClientRect')
    bounds.mockReturnValue({ width: 800, height: 400 } as DOMRect)
    const { app, captured, host, addButton } = mountDialog()
    try {
      await vi.waitFor(() => expect(addButton().disabled).toBe(false))
      const locationButton = Array.from(host.querySelectorAll('button')).find(
        (button) => button.textContent === 'Select location',
      )!
      locationButton.click()
      await nextTick()
      const svg = host.querySelector('svg')
      addButton().click()
      await vi.waitFor(() =>
        expect(captured).toHaveBeenCalledWith(blob, 'Second'),
      )
      expect(fetchAndInlineCssAndFonts).toHaveBeenCalledWith('test.css')
      expect(captureNodeScreenshot).toHaveBeenCalledWith(fakeMap, {
        chart: {
          svg,
          css: 'chart css',
          width: 800,
          height: 400,
        },
        maxDimension: 1280,
      })
    } finally {
      app.unmount()
      bounds.mockRestore()
    }
  })
})
