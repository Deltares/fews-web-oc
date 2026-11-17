// @vitest-environment jsdom
import { createApp, defineComponent, h, nextTick, onMounted, ref } from 'vue'
import { createI18n } from 'vue-i18n'
import { afterEach, describe, expect, it, vi } from 'vitest'
import NodeScreenshotDialog from '@/components/reports/dynamic/NodeScreenshotDialog.vue'
import { captureNodeScreenshot } from '@/lib/dynamic-report/screenshot'
import { getLayerNameForNode } from '@/lib/topology/displayTabs'
import { getDefaultSettings } from '@/lib/topology/componentSettings'

const fakeMap = { name: 'map', resize: vi.fn() }
const mobile = ref(false)
vi.mock('vuetify', () => ({
  useDisplay: () => ({ mobile }),
}))
const screenshotContext = vi.hoisted(() => ({
  get: vi.fn(() => ({
    source: 'rainfall',
    validTime: '2026-11-13T06:00:00.000Z',
  })),
}))
vi.mock('@/lib/dynamic-report/screenshot', () => ({
  captureNodeScreenshot: vi.fn(),
}))
vi.mock('@/lib/topology/displayTabs', () => ({
  getLayerNameForNode: vi.fn(async () => 'layer'),
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
    props: {
      independentContext: Boolean,
      locationIds: String,
      latitude: String,
      longitude: String,
    },
    emits: ['navigate'],
    setup(_props, { slots, emit, expose }) {
      expose({ getScreenshotContext: screenshotContext.get })
      return () =>
        h(
          'div',
          {
            'data-independent-context': String(_props.independentContext),
            'data-location': _props.locationIds,
            'data-latitude': _props.latitude,
            'data-longitude': _props.longitude,
          },
          [
            slots.map?.(),
            h(
              'button',
              {
                onClick: () =>
                  emit('navigate', { params: { locationIds: 'x' } }),
              },
              'Select location',
            ),
            h('div', { class: 'chart-container' }, [h('svg')]),
            h('div', { class: 'colourbar-container' }, 'Colour legend'),
          ],
        )
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
      (_props, { slots, attrs }) =>
      () =>
        h('div', { ...attrs, class: 'capture-dialog' }, slots.default?.()),
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
    setup(props, { emit, attrs }) {
      return () =>
        h(
          'select',
          {
            ...attrs,
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
    setup(props, { emit, attrs }) {
      return () =>
        h(
          'select',
          {
            ...attrs,
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

afterEach(() => {
  mobile.value = false
  vi.clearAllMocks()
  screenshotContext.get.mockReturnValue({
    source: 'rainfall',
    validTime: '2026-11-13T06:00:00.000Z',
  })
})

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
            screenshotCaption:
              '{node} - Source data: {source}. Valid time: {validTime} (UTC).',
            screenshotInstructions:
              'Choose a node, adjust the map and wait for the legend and chart to load.',
            selectNode: 'Node',
            screenshotSize: 'Screenshot size',
            screenshotSizeSmall: 'Small ({size} px)',
            screenshotSizeMedium: 'Medium ({size} px)',
            screenshotSizeLarge: 'Large ({size} px)',
            screenshotAspectRatio: 'Map aspect ratio',
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
  it('uses the full mobile viewport and expands desktop dialog height', async () => {
    const { app, host, addButton } = mountDialog()
    try {
      await vi.waitFor(() => expect(addButton().disabled).toBe(false))
      const dialog = host.querySelector('.capture-dialog')!
      expect(dialog.getAttribute('height')).toBe('calc(100dvh - 48px)')
      expect(dialog.getAttribute('max-width')).toBe('1200')
      mobile.value = true
      await nextTick()
      expect(dialog.getAttribute('fullscreen')).toBe('true')
      expect(dialog.hasAttribute('height')).toBe(false)
      expect(dialog.hasAttribute('max-width')).toBe(false)
    } finally {
      app.unmount()
    }
  })

  it.each([16 / 9, 4 / 3, 1, 3 / 4])(
    'resizes the map preview for aspect ratio %s with compact tonal controls',
    async (ratio) => {
      const { app, host, addButton } = mountDialog()
      try {
        await vi.waitFor(() => expect(addButton().disabled).toBe(false))
        const select = host.querySelector<HTMLSelectElement>(
          'select[aria-label="Map aspect ratio"]',
        )!
        expect(select.options).toHaveLength(4)
        select.value = String(ratio)
        select.dispatchEvent(new Event('change'))
        await nextTick()
        await nextTick()
        if (ratio !== 16 / 9) expect(fakeMap.resize).toHaveBeenCalledOnce()
        const preview = host.querySelector<HTMLElement>('.preview')!
        expect(preview.classList.contains('preview-fixed-ratio')).toBe(
          ratio > 0,
        )
        if (ratio) {
          expect(parseFloat(preview.style.aspectRatio)).toBe(ratio)
          expect(preview.style.getPropertyValue('--preview-aspect-ratio')).toBe(
            String(ratio),
          )
        } else {
          expect(preview.style.aspectRatio).toBe('')
        }
        const sizeSelect = host.querySelector<HTMLSelectElement>(
          'select[aria-label="Screenshot size"]',
        )!
        expect(
          select.compareDocumentPosition(sizeSelect) &
            Node.DOCUMENT_POSITION_FOLLOWING,
        ).toBeTruthy()
        expect(select.parentElement).toBe(sizeSelect.parentElement)
        expect(sizeSelect.value).toBe('1920')
        if (ratio) {
          expect(
            Array.from(sizeSelect.options, (option) => option.textContent),
          ).toEqual([
            `Small (640 × ${Math.round(640 / ratio)} px)`,
            `Medium (1280 × ${Math.round(1280 / ratio)} px)`,
            `Large (1920 × ${Math.round(1920 / ratio)} px)`,
          ])
        }
        for (const field of host.querySelectorAll('select')) {
          expect(field.getAttribute('density')).toBe('compact')
          expect(field.getAttribute('variant')).toBe('solo-filled')
          expect(field.hasAttribute('flat')).toBe(true)
        }
        for (const button of Array.from(host.querySelectorAll('button')).filter(
          (button) => ['Add', 'Cancel'].includes(button.textContent ?? ''),
        )) {
          expect(button.getAttribute('density')).toBe('compact')
          expect(button.getAttribute('variant')).toBe('tonal')
        }
      } finally {
        app.unmount()
      }
    },
  )

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
      expect(
        host.querySelector('[data-independent-context="true"]'),
      ).not.toBeNull()
      expect(host.textContent).toContain(
        'Choose a node, adjust the map and wait for the legend and chart to load.',
      )
      const add = addButton()
      await vi.waitFor(() => expect(add.disabled).toBe(false))
      add.click()
      await vi.waitFor(() =>
        expect(captured).toHaveBeenCalledWith(
          blob,
          'Second',
          'Second - Source data: rainfall. Valid time: 2026-11-13T06:00:00.000Z (UTC).',
        ),
      )
      expect(captureNodeScreenshot).toHaveBeenCalledWith(fakeMap, {
        legend: expect.any(HTMLElement),
        width: 1920,
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
          legend: expect.any(HTMLElement),
          width: size,
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

  it('does not insert a screenshot with a stale valid time', async () => {
    let finish!: (image: Blob) => void
    vi.mocked(captureNodeScreenshot).mockReturnValueOnce(
      new Promise((resolve) => {
        finish = resolve
      }),
    )
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { app, open, captured, host, addButton } = mountDialog()
    try {
      await vi.waitFor(() => expect(addButton().disabled).toBe(false))
      addButton().click()
      await vi.waitFor(() => expect(captureNodeScreenshot).toHaveBeenCalled())
      screenshotContext.get.mockReturnValue({
        source: 'rainfall',
        validTime: '2026-11-13T07:00:00.000Z',
      })
      finish(new Blob(['map'], { type: 'image/png' }))
      await vi.waitFor(() =>
        expect(host.textContent).toContain('Capture failed'),
      )
      expect(captured).not.toHaveBeenCalled()
      expect(open.value).toBe(true)
    } finally {
      app.unmount()
      log.mockRestore()
    }
  })

  it('captures only the map even after location navigation', async () => {
    const blob = new Blob(['map'], { type: 'image/png' })
    vi.mocked(captureNodeScreenshot).mockResolvedValueOnce(blob)
    const { app, captured, host, addButton } = mountDialog()
    try {
      await vi.waitFor(() => expect(addButton().disabled).toBe(false))
      const locationButton = Array.from(host.querySelectorAll('button')).find(
        (button) => button.textContent === 'Select location',
      )!
      locationButton.click()
      await nextTick()
      expect(
        host.querySelector(
          '[data-location], [data-latitude], [data-longitude]',
        ),
      ).toBeNull()
      addButton().click()
      await vi.waitFor(() =>
        expect(captured).toHaveBeenCalledWith(
          blob,
          'Second',
          'Second - Source data: rainfall. Valid time: 2026-11-13T06:00:00.000Z (UTC).',
        ),
      )
      expect(captureNodeScreenshot).toHaveBeenCalledWith(fakeMap, {
        legend: expect.any(HTMLElement),
        width: 1920,
      })
    } finally {
      app.unmount()
    }
  })
})
