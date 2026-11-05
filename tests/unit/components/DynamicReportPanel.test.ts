// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { type App, createApp, h, nextTick, reactive } from 'vue'
import { createI18n } from 'vue-i18n'
import DynamicReportPanel from '@/components/timeseries/DynamicReportPanel.vue'
import en from '@/locales/en.json'
import type { DynamicReportPanelConfig } from '@/services/useDynamicReport'

const { getDynamicReportDisplay } = vi.hoisted(() => ({
  getDynamicReportDisplay: vi.fn(),
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

vi.mock('@/components/general/ShadowFrame.vue', () => ({
  default: {
    props: ['htmlContent'],
    render(this: { htmlContent: string }) {
      return h('div', { class: 'report' }, this.htmlContent)
    },
  },
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
  }) {
    const props = reactive({ ...initial })
    app = createApp({
      render: () =>
        h(DynamicReportPanel, {
          config: props.config,
          selectedDate: props.selectedDate,
        }),
    })
    app.use(createI18n({ legacy: false, locale: 'en', messages: { en } }))
    app.mount(container)
    return props
  }

  beforeEach(() => {
    container = document.createElement('div')
    getDynamicReportDisplay.mockReset()
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
})
