// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  type App,
  createApp,
  defineComponent,
  h,
  nextTick,
  reactive,
} from 'vue'
import { createI18n } from 'vue-i18n'
import DynamicReportPanel from '@/components/timeseries/DynamicReportPanel.vue'
import en from '@/locales/en.json'
import type { DynamicReportPanelConfig } from '@/services/useDynamicReport'

const { getDynamicReportDisplay, insertScreenshot, dialogProps } = vi.hoisted(
  () => ({
    getDynamicReportDisplay: vi.fn(),
    insertScreenshot: vi.fn(),
    dialogProps: vi.fn(),
  }),
)

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

vi.mock('@/components/reports/DynamicReportContent.vue', () => ({
  default: defineComponent({
    props: ['html', 'editable', 'initialEditorHtml'],
    emits: ['update'],
    setup(props, { expose, emit }) {
      expose({ insertScreenshot })
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

vi.mock('vuetify/lib/components/VToolbar/index.mjs', () => ({
  VToolbar: defineComponent({
    setup:
      (_props, { slots }) =>
      () =>
        h('div', slots.default?.()),
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
  }) {
    const props = reactive({ ...initial })
    app = createApp({
      render: () =>
        h(DynamicReportPanel, {
          config: props.config,
          selectedDate: props.selectedDate,
          initialNodeId: props.initialNodeId,
        }),
    })
    app.use(createI18n({ legacy: false, locale: 'en', messages: { en } }))
    app.mount(container)
    return props
  }

  beforeEach(() => {
    container = document.createElement('div')
    getDynamicReportDisplay.mockReset()
    insertScreenshot.mockReset()
    insertScreenshot.mockResolvedValue(undefined)
    dialogProps.mockReset()
  })

  afterEach(() => {
    app?.unmount()
    app = undefined
  })

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
    expect(insertScreenshot).toHaveBeenCalledWith(expect.any(Blob), 'Node')
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
    expect(container.textContent).toContain(en.dynamicReport.unsavedReport)
    props.config = { ...config(), locationId: 'b' }
    await flushPromises()
    expect(container.textContent).not.toContain(en.dynamicReport.unsavedReport)
    expect(container.querySelector('.report')?.textContent).toContain(
      'same report',
    )
  })
})
