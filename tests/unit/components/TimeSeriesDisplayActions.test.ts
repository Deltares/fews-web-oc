// @vitest-environment jsdom
import { createApp, defineComponent, type App } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import TimeSeriesDisplayActions from '@/components/timeseries/TimeSeriesDisplayActions.vue'
import { defaultChartSettings } from '@/lib/topology/componentSettings'
import type { DynamicReportPanelConfig } from '@/services/useDynamicReport'

vi.mock('vuetify/lib/components/VBtn/index.mjs', () => ({
  VBtn: defineComponent({
    props: { disabled: Boolean },
    template: '<button :disabled="disabled"><slot /></button>',
  }),
}))
vi.mock('vuetify/lib/components/VIcon/index.mjs', () => ({
  VIcon: defineComponent({ template: '<i><slot /></i>' }),
}))
vi.mock('vuetify/lib/components/VMenu/index.mjs', () => ({
  VMenu: defineComponent({ template: '<div><slot /></div>' }),
}))
vi.mock('vuetify/lib/components/VList/index.mjs', () => ({
  VList: defineComponent({ template: '<div><slot /></div>' }),
  VListItem: defineComponent({
    props: { disabled: Boolean },
    template: '<button :disabled="disabled"><slot /></button>',
  }),
}))
vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}))
vi.mock('@/components/download/TimeSeriesFileDownloadComponent.vue', () => ({
  default: defineComponent({ template: '<div />' }),
}))
vi.mock('@/stores/userSettings', () => ({
  useUserSettingsStore: () => ({
    useDisplayUnits: true,
    convertDatum: true,
  }),
}))

describe('TimeSeriesDisplayActions', () => {
  let app: App | undefined

  afterEach(() => {
    app?.unmount()
    app = undefined
  })

  it('does not serialize an invalid current time for a dynamic report', () => {
    const dynamicReport = {
      displayId: 'report',
      capabilities: { dimension: { name: 'time' } },
    } as DynamicReportPanelConfig
    const container = document.createElement('div')

    app = createApp(TimeSeriesDisplayActions, {
      currentTime: new Date(Number.NaN),
      dynamicReport,
      settings: defaultChartSettings,
    })

    expect(() => app?.mount(container)).not.toThrow()
    expect(container.querySelector('button:disabled')).not.toBeNull()
  })
})
