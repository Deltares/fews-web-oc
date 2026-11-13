// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  type App,
  createApp,
  computed,
  defineComponent,
  h,
  nextTick,
  reactive,
} from 'vue'
import { createI18n } from 'vue-i18n'
import DynamicReportPanel from '@/components/timeseries/DynamicReportPanel.vue'
import TimeSeriesWindowComponent from '@/components/timeseries/TimeSeriesWindowComponent.vue'
import { printDynamicReport } from '@/lib/dynamic-report/print'
import en from '@/locales/en.json'
import type { DynamicReportPanelConfig } from '@/services/useDynamicReport'
import {
  getDefaultSettings,
  type ComponentSettings,
} from '@/lib/topology/componentSettings'

const { getDynamicReportDisplay, insertScreenshot, dialogProps, downloadBlob } =
  vi.hoisted(() => ({
    getDynamicReportDisplay: vi.fn(),
    insertScreenshot: vi.fn(),
    dialogProps: vi.fn(),
    downloadBlob: vi.fn(),
  }))

vi.mock('@/lib/download/downloadFiles', () => ({
  clickDownloadBlob: downloadBlob,
}))
vi.mock('@/lib/dynamic-report/print', () => ({
  printDynamicReport: vi.fn(async () => {}),
}))

vi.mock('@deltares/fews-pi-requests', () => ({
  PiWebserviceProvider: vi.fn(function () {
    return { getDynamicReportDisplay }
  }),
}))

vi.mock('@/lib/requests/transformRequest', () => ({
  createTransformRequestFn: vi.fn(),
}))

vi.mock('@/services/application-config', () => ({
  configManager: { get: () => 'http://fews' },
}))

vi.mock('@/stores/userSettings', () => ({
  useUserSettingsStore: () => ({ useDisplayUnits: false, convertDatum: false }),
}))

vi.mock('@/components/download/TimeSeriesFileDownloadComponent.vue', () => ({
  default: defineComponent({ setup: () => () => null }),
}))

vi.mock('@/components/general/WindowComponent.vue', () => ({
  default: defineComponent({
    setup:
      (_props, { slots }) =>
      () =>
        h('div', [
          h('div', { class: 'window-toolbar' }, [
            slots.toolbar?.(),
            slots['toolbar-append']?.(),
          ]),
          h('div', { class: 'window-content' }, slots.default?.()),
        ]),
  }),
}))

vi.mock('@/components/timeseries/TimeSeriesComponent.vue', () => ({
  default: defineComponent({
    inheritAttrs: false,
    props: [
      'dynamicReport',
      'reportSettings',
      'downloadReport',
      'reportExportMode',
      'reportToolbarTarget',
    ],
    emits: ['close-report-export'],
    setup:
      (props, { emit }) =>
      () =>
        h(DynamicReportPanel, {
          config: props.dynamicReport,
          settings: props.reportSettings,
          downloadReport: props.downloadReport,
          exportMode: props.reportExportMode,
          toolbarTarget: props.reportToolbarTarget,
          onCloseExport: () => emit('close-report-export'),
        }),
  }),
}))

vi.mock('@/components/reports/DynamicReportContent.vue', () => ({
  default: defineComponent({
    props: ['html', 'editable', 'initialEditorHtml'],
    emits: ['update'],
    setup(props, { expose, emit }) {
      expose({
        insertScreenshot,
        editor: computed(() =>
          props.editable ? { name: 'active-report-editor' } : undefined,
        ),
      })
      return () =>
        h('div', { class: 'report' }, [
          h('span', props.editable ? 'editing' : props.html),
          props.editable
            ? h(
                'button',
                { onClick: () => emit('update', '<p>edited</p>') },
                'Change',
              )
            : null,
        ])
    },
  }),
}))

vi.mock('@/components/reports/tiptap/BaseMenu.vue', () => ({
  default: defineComponent({
    props: ['editor'],
    setup: (props) => () =>
      h(
        'div',
        {
          class: 'formatting-menu',
          'data-editor': props.editor.name,
        },
        'Formatting controls',
      ),
  }),
}))

vi.mock('@/components/reports/dynamic/NodeScreenshotDialog.vue', () => ({
  default: defineComponent({
    props: ['modelValue', 'settings', 'initialNodeId'],
    emits: ['capture', 'update:modelValue'],
    setup(props, { emit }) {
      return () => {
        dialogProps(props.initialNodeId, props.settings)
        return props.modelValue
          ? h(
              'button',
              { onClick: () => emit('capture', new Blob(['image']), 'Node') },
              'Capture',
            )
          : null
      }
    },
  }),
}))

vi.mock('vuetify/lib/components/VDefaultsProvider/index.mjs', () => ({
  VDefaultsProvider: defineComponent({
    props: ['defaults'],
    setup:
      (props, { slots }) =>
      () =>
        h(
          'div',
          {
            'data-button-density': props.defaults.VBtn.density,
          },
          slots.default?.(),
        ),
  }),
}))

vi.mock('vuetify/lib/components/VToolbar/index.mjs', () => ({
  VToolbarItems: defineComponent({
    setup:
      (_props, { slots }) =>
      () =>
        h('div', slots.default?.()),
  }),
  VToolbar: defineComponent({
    setup:
      (_props, { slots }) =>
      () =>
        h('div', slots.default?.()),
  }),
}))
vi.mock('vuetify/lib/components/VIcon/index.mjs', () => ({
  VIcon: defineComponent({
    setup:
      (_props, { slots }) =>
      () =>
        h('span', slots.default?.()),
  }),
}))
vi.mock('vuetify/lib/components/VTooltip/index.mjs', () => ({
  VTooltip: defineComponent({
    props: ['text'],
    setup:
      (props, { slots }) =>
      () =>
        h(
          'div',
          { class: 'report-info-tooltip', 'data-tooltip': props.text },
          slots.activator?.({ props: {} }),
        ),
  }),
}))
vi.mock('vuetify/lib/components/VGrid/index.mjs', () => ({
  VSpacer: defineComponent({ setup: () => () => h('div') }),
}))
vi.mock('vuetify/lib/components/VBtn/index.mjs', () => ({
  VBtn: defineComponent({
    setup:
      (_props, { slots, attrs }) =>
      () =>
        h('button', attrs, slots.default?.()),
  }),
}))
vi.mock('vuetify/lib/components/VAlert/index.mjs', () => ({
  VAlert: defineComponent({
    setup:
      (_props, { slots }) =>
      () =>
        h('div', { role: 'alert' }, slots.default?.()),
  }),
}))

vi.mock('vuetify/lib/components/VMenu/index.mjs', () => ({
  VMenu: defineComponent({
    setup:
      (_props, { slots }) =>
      () =>
        h('div', [slots.activator?.({ props: {} }), slots.default?.()]),
  }),
}))

vi.mock('vuetify/lib/components/VList/index.mjs', () => ({
  VList: defineComponent({
    setup:
      (_props, { slots }) =>
      () =>
        h('div', slots.default?.()),
  }),
  VListItem: defineComponent({
    props: ['title'],
    setup:
      (props, { attrs, slots }) =>
      () =>
        h('button', attrs, props.title ?? slots.default?.()),
  }),
}))

vi.mock('vuetify/components/VAlert', () => ({
  VAlert: {
    render(this: { $slots: { default?: () => any } }) {
      return h('div', { role: 'alert' }, this.$slots.default?.())
    },
  },
}))

async function flushPromises() {
  await nextTick()
  await new Promise((resolve) => setTimeout(resolve))
  await nextTick()
}

function config(dimensionName?: string): DynamicReportPanelConfig {
  return {
    displayId: 'display',
    capabilities: dimensionName ? { dimension: { name: dimensionName } } : {},
  } as DynamicReportPanelConfig
}

describe('DynamicReportPanel', () => {
  let app: App | undefined
  let container: HTMLElement

  function mountPanel(initial: {
    config: DynamicReportPanelConfig
    selectedDate?: Date
    initialNodeId?: string
    settings?: ComponentSettings
    downloadReport?: boolean
    exportMode?: boolean
    toolbarTarget?: HTMLElement
  }) {
    const props = reactive({ ...initial })
    app = createApp({
      render: () =>
        h(DynamicReportPanel, {
          config: props.config,
          selectedDate: props.selectedDate,
          initialNodeId: props.initialNodeId,
          settings: props.settings,
          downloadReport: props.downloadReport,
          exportMode: props.exportMode ?? true,
          toolbarTarget: props.toolbarTarget,
        }),
    })
    app.use(createI18n({ legacy: false, locale: 'en', messages: { en } }))
    app.mount(container)
    return props
  }

  beforeEach(() => {
    container = document.createElement('div')
    container.id = 'main'
    document.body.appendChild(container)
    getDynamicReportDisplay.mockReset()
    insertScreenshot.mockReset()
    insertScreenshot.mockResolvedValue(undefined)
    dialogProps.mockReset()
    downloadBlob.mockReset()
  })

  afterEach(() => {
    app?.unmount()
    container.remove()
    app = undefined
    vi.restoreAllMocks()
  })

  async function click(label: string) {
    const button = Array.from(container.querySelectorAll('button')).find(
      (element) => element.textContent?.trim() === label,
    )
    expect(button).toBeDefined()
    button!.click()
    await flushPromises()
  }

  it('keeps the normal report view free of editing and export toolbars', async () => {
    getDynamicReportDisplay.mockResolvedValue('<p>report</p>')
    mountPanel({ config: config(), exportMode: false })
    await flushPromises()
    expect(container.textContent).not.toContain(en.dynamicReport.editReport)
    expect(container.textContent).not.toContain(en.dynamicReport.exportReport)
    expect(container.querySelector('.report')?.textContent).toContain('report')
  })

  it('shows BaseMenu for the active editor only while editing', async () => {
    getDynamicReportDisplay.mockResolvedValue('<p>report</p>')
    mountPanel({ config: config() })
    await flushPromises()
    expect(container.querySelector('.formatting-menu')).toBeNull()

    await click(en.dynamicReport.editReport)
    expect(
      container.querySelector('.formatting-menu')?.getAttribute('data-editor'),
    ).toBe('active-report-editor')
    const formattingToolbar = container.querySelector(
      '.dynamic-report-formatting-toolbar',
    )!
    expect(formattingToolbar.querySelector('.formatting-menu')).not.toBeNull()
    expect(
      formattingToolbar.querySelector('[data-button-density="compact"]'),
    ).not.toBeNull()
    expect(
      formattingToolbar.closest('.dynamic-report-editor-area'),
    ).not.toBeNull()

    await click(en.dynamicReport.previewReport)
    expect(container.querySelector('.formatting-menu')).toBeNull()
  })

  it('puts the primary Edit/Preview toggle first and shows separate export buttons with icons', async () => {
    getDynamicReportDisplay.mockResolvedValue('<p>report</p>')
    mountPanel({ config: config() })
    await flushPromises()

    const firstButton = () => container.querySelector('button')!
    expect(firstButton().textContent?.trim()).toBe('Edit')
    expect(firstButton().getAttribute('color')).toBe('primary')
    expect(container.textContent).not.toContain(en.dynamicReport.exportReport)
    const buttons = Array.from(container.querySelectorAll('button'))
    expect(
      buttons
        .find(
          (button) => button.textContent?.trim() === en.dynamicReport.saveHtml,
        )
        ?.getAttribute('prepend-icon'),
    ).toBe('mdi-file-code-outline')
    expect(
      buttons
        .find((button) => button.textContent?.trim() === 'Print or save as PDF')
        ?.getAttribute('prepend-icon'),
    ).toBe('mdi-printer')

    await click('Edit')
    expect(firstButton().textContent?.trim()).toBe('Preview')
    expect(firstButton().getAttribute('color')).toBe('primary')
    await click('Preview')
    expect(firstButton().textContent?.trim()).toBe('Edit')
  })

  it('shows the local-only notice as an info tooltip instead of an inline alert', async () => {
    getDynamicReportDisplay.mockResolvedValue('<p>report</p>')
    mountPanel({ config: config() })
    await flushPromises()

    const tooltip = container.querySelector('.report-info-tooltip')!
    expect(tooltip.getAttribute('data-tooltip')).toBe(
      en.dynamicReport.unsavedReport,
    )
    expect(tooltip.querySelector('button')?.getAttribute('aria-label')).toBe(
      en.dynamicReport.unsavedReport,
    )
    expect(container.textContent).not.toContain(en.dynamicReport.unsavedReport)
    expect(container.querySelector('[role="alert"]')).toBeNull()
  })

  it('shows the original report outside export mode and restores local edits when reopened', async () => {
    const toolbarTarget = document.createElement('div')
    getDynamicReportDisplay.mockResolvedValue('<p>report</p>')
    const props = mountPanel({ config: config() })
    container.appendChild(toolbarTarget)
    props.toolbarTarget = toolbarTarget
    await flushPromises()
    expect(toolbarTarget.textContent).toContain(en.dynamicReport.editReport)
    await click(en.dynamicReport.editReport)
    await click('Change')

    props.exportMode = false
    await flushPromises()
    expect(toolbarTarget.textContent).toBe('')
    expect(container.querySelector('.report')?.textContent).toContain(
      '<p>report</p>',
    )
    expect(container.querySelector('.report')?.textContent).not.toContain(
      'edited',
    )

    props.exportMode = true
    await flushPromises()
    expect(toolbarTarget.textContent).toContain(en.dynamicReport.saveHtml)
    expect(container.querySelector('.report')?.textContent).toContain('edited')
  })

  it('opens report export from the dot menu, replaces the window toolbar and restores it on close', async () => {
    getDynamicReportDisplay.mockResolvedValue('<p>report</p>')
    const settings = structuredClone(getDefaultSettings())
    settings.charts.dynamicReportDisplay.enabled = true
    app = createApp({
      render: () =>
        h(TimeSeriesWindowComponent, {
          settings: settings.charts,
          reportSettings: settings,
          dynamicReport: config(),
        }),
    })
    app.use(createI18n({ legacy: false, locale: 'en', messages: { en } }))
    app.mount(container)
    await flushPromises()
    expect(
      container.querySelector('.window-toolbar [name="Time series actions"]'),
    ).not.toBeNull()
    expect(container.textContent).not.toContain(en.dynamicReport.editReport)

    await click(en.dynamicReport.exportReport)
    const exportArea = container.querySelector('.report-export-main')!
    expect(exportArea).not.toBeNull()
    expect(exportArea.parentElement).toBe(container)
    const toolbar = container.querySelector('.window-toolbar')!
    expect(toolbar.textContent).toContain(en.dynamicReport.editReport)
    expect(toolbar.textContent).toContain(en.dynamicReport.saveHtml)
    expect(toolbar.textContent).toContain(en.dynamicReport.savePdf)
    expect(toolbar.textContent).not.toContain(en.dynamicReport.exportReport)
    expect(toolbar.querySelector('[name="Time series actions"]')).toBeNull()
    expect(
      container.querySelector('.window-content')?.textContent,
    ).not.toContain(en.dynamicReport.editReport)

    const close = toolbar.querySelector<HTMLButtonElement>(
      `[aria-label="${en.dynamicReport.closeExport}"]`,
    )!
    expect(close).not.toBeNull()
    close.click()
    await flushPromises()
    expect(container.querySelector('.report-export-main')).toBeNull()
    expect(
      container.querySelector('.window-toolbar [name="Time series actions"]'),
    ).not.toBeNull()
    expect(container.textContent).not.toContain(en.dynamicReport.editReport)
  })

  it.each(['prop', 'setting'])(
    'hides the dot-menu export action when disabled by %s',
    async (source) => {
      getDynamicReportDisplay.mockResolvedValue('<p>report</p>')
      const settings = structuredClone(getDefaultSettings())
      settings.charts.dynamicReportDisplay.enabled = true
      settings.report.downloadReport = source !== 'setting'
      app = createApp({
        render: () =>
          h(TimeSeriesWindowComponent, {
            settings: settings.charts,
            reportSettings: settings,
            dynamicReport: config(),
            downloadReport: source !== 'prop',
          }),
      })
      app.use(createI18n({ legacy: false, locale: 'en', messages: { en } }))
      app.mount(container)
      await flushPromises()

      expect(container.textContent).not.toContain(en.dynamicReport.exportReport)
      expect(container.textContent).not.toContain(en.dynamicReport.editReport)
    },
  )

  it('exports the edited time series report as HTML with its styles and filter filename', async () => {
    getDynamicReportDisplay.mockResolvedValue(
      '<html><head><style>p { color: red }</style></head><body><p>original</p></body></html>',
    )
    mountPanel({
      config: { ...config('time'), locationId: 'location' },
      selectedDate: new Date('2026-01-01T00:00:00Z'),
    })
    await flushPromises()

    await click(en.dynamicReport.editReport)
    await click('Change')
    await click(en.dynamicReport.saveHtml)

    expect(downloadBlob).toHaveBeenCalledWith(
      expect.any(Blob),
      'display-location-2026-01-01T00_00_00.000Z.html',
    )
    const blob = downloadBlob.mock.calls[0][0] as Blob
    expect(blob.type).toBe('text/html')
    const html = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => reject(reader.error)
      reader.readAsText(blob)
    })
    expect(html).toContain('<p>edited</p>')
    expect(html).toContain('<style>p { color: red }</style>')
    expect(html).not.toContain('original')
  })

  it('prints the current edited report with its original styles', async () => {
    vi.mocked(printDynamicReport).mockClear()
    getDynamicReportDisplay.mockResolvedValue(
      '<html><head><style>p { color: red }</style></head><body><p>original</p></body></html>',
    )
    mountPanel({ config: config() })
    await flushPromises()

    await click(en.dynamicReport.editReport)
    await click('Change')
    await click(en.dynamicReport.savePdf)

    expect(printDynamicReport).toHaveBeenCalledWith(
      expect.stringContaining('<p>edited</p>'),
      'display',
    )
    expect(vi.mocked(printDynamicReport).mock.calls[0][0]).toContain(
      '<style>p { color: red }</style>',
    )
  })

  it('shows a notification if the print tab cannot be opened', async () => {
    vi.mocked(printDynamicReport).mockRejectedValueOnce(
      new Error('Popup blocked'),
    )
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    getDynamicReportDisplay.mockResolvedValue('<p>report</p>')
    mountPanel({ config: config() })
    await flushPromises()
    await click(en.dynamicReport.savePdf)
    expect(container.textContent).toContain(en.dynamicReport.printFailed)
    expect(error).toHaveBeenCalledWith(
      'Failed to print dynamic report',
      expect.any(Error),
    )
  })

  it.each(['prop', 'setting'])(
    'hides export when disabled by %s',
    async (source) => {
      const settings = structuredClone(getDefaultSettings())
      settings.report.downloadReport = source !== 'setting'
      getDynamicReportDisplay.mockResolvedValue('<p>report</p>')
      mountPanel({
        config: config(),
        settings,
        downloadReport: source !== 'prop',
      })
      await flushPromises()

      expect(container.textContent).not.toContain(en.dynamicReport.exportReport)
      expect(container.textContent).not.toContain(en.dynamicReport.saveHtml)
      expect(container.textContent).not.toContain(en.dynamicReport.savePdf)
      expect(container.textContent).toContain(en.dynamicReport.editReport)
    },
  )

  it('refetches a report with a time dimension when the date changes', async () => {
    getDynamicReportDisplay.mockResolvedValue('report')
    const props = mountPanel({
      config: config('time'),
      selectedDate: new Date('2026-01-01T00:00:00Z'),
    })
    await flushPromises()

    props.selectedDate = new Date('2026-01-01T01:00:00Z')
    await flushPromises()

    expect(getDynamicReportDisplay).toHaveBeenCalledTimes(2)
    expect(getDynamicReportDisplay).toHaveBeenLastCalledWith(
      expect.objectContaining({ time: '2026-01-01T01:00:00.000Z' }),
    )
  })

  it('does not refetch a report without a time dimension when the date changes', async () => {
    getDynamicReportDisplay.mockResolvedValue('report')
    const props = mountPanel({
      config: config(),
      selectedDate: new Date('2026-01-01T00:00:00Z'),
    })
    await flushPromises()

    props.selectedDate = new Date('2026-01-01T01:00:00Z')
    await flushPromises()

    expect(getDynamicReportDisplay).toHaveBeenCalledTimes(1)
    expect(getDynamicReportDisplay.mock.calls[0][0].time).toBeUndefined()
  })

  it('shows a message when a required time is missing', async () => {
    mountPanel({ config: config('time') })
    await flushPromises()

    expect(getDynamicReportDisplay).not.toHaveBeenCalled()
    expect(container.textContent).toContain(en.reports.noReportAvailable)
  })

  it('shows an error instead of the empty message when the request fails', async () => {
    getDynamicReportDisplay.mockRejectedValue(new Error('failed'))
    mountPanel({ config: config() })
    await flushPromises()

    expect(container.querySelector('[role="alert"]')?.textContent).toBe(
      en.reports.loadFailed,
    )
    expect(container.textContent).not.toContain(en.reports.noReportAvailable)
  })

  it('edits the report and inserts screenshots from the time series panel', async () => {
    getDynamicReportDisplay.mockResolvedValue('<p>report</p>')
    mountPanel({ config: config(), initialNodeId: 'node-1' })
    await flushPromises()
    const click = async (label: string) => {
      const button = Array.from(container.querySelectorAll('button')).find(
        (element) => element.textContent?.trim() === label,
      )
      expect(button).toBeDefined()
      button!.click()
      await flushPromises()
    }

    await click(en.dynamicReport.editReport)
    expect(container.querySelector('.report')?.textContent).toContain('editing')
    await click('Change')
    await click(en.dynamicReport.addScreenshot)
    expect(dialogProps).toHaveBeenLastCalledWith('node-1', expect.any(Object))
    await click('Capture')
    expect(insertScreenshot).toHaveBeenCalledWith(
      expect.any(Blob),
      'Node',
      undefined,
    )
    await click(en.dynamicReport.previewReport)
    expect(container.querySelector('.report')?.textContent).toContain('edited')
  })

  it('clears temporary edits when the selected report location changes even if the HTML is identical', async () => {
    getDynamicReportDisplay.mockResolvedValue('<p>same report</p>')
    const props = mountPanel({ config: { ...config(), locationId: 'a' } })
    await flushPromises()
    const edit = Array.from(container.querySelectorAll('button')).find(
      (button) => button.textContent?.trim() === en.dynamicReport.editReport,
    )!
    edit.click()
    await flushPromises()
    expect(container.textContent).toContain(en.dynamicReport.previewReport)
    props.config = { ...config(), locationId: 'b' }
    await flushPromises()
    expect(container.textContent).not.toContain(en.dynamicReport.previewReport)
    expect(container.querySelector('.report')?.textContent).toContain(
      'same report',
    )
  })
})
