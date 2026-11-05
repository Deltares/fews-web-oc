// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { createApp, h, nextTick, reactive, type App } from 'vue'
import { createI18n } from 'vue-i18n'
import DownloadReportButton from '@/components/reports/DownloadReportButton.vue'
import { downloadFileWithXhr } from '@/lib/download'
import { getRequestHeaders } from '@/lib/requests/transformRequest'
import en from '@/locales/en.json'

vi.mock('@/lib/download', () => ({ downloadFileWithXhr: vi.fn() }))
vi.mock('@/lib/requests/transformRequest', () => ({
  getRequestHeaders: vi.fn(),
}))
vi.mock('@/services/application-config', () => ({
  configManager: { get: () => 'https://fews.example/FewsWebServices' },
}))
vi.mock('vuetify/lib/components/VBtn/index.js', () => ({
  VBtn: {
    props: ['disabled'],
    template: '<button :disabled="disabled"><slot /></button>',
  },
}))
vi.mock('vuetify/lib/components/VIcon/index.js', () => ({
  VIcon: { template: '<span />' },
}))
vi.mock('vuetify/lib/components/VTooltip/index.js', () => ({
  VTooltip: { template: '<span />' },
}))

let app: App | undefined
afterEach(() => {
  app?.unmount()
  vi.clearAllMocks()
})

it('downloads the report URL with authentication and the current report filters', async () => {
  const headers = new Headers({ Authorization: 'Bearer test-token' })
  vi.mocked(getRequestHeaders).mockResolvedValue(headers)
  const props = reactive({
    displayId: 'warning',
    locationId: 'district',
    time: '2026-11-05T12:00:00.000Z',
    disabled: true,
  })
  const container = document.createElement('div')
  app = createApp({ render: () => h(DownloadReportButton, props) })
  app.use(createI18n({ legacy: false, locale: 'en', messages: { en } }))
  app.mount(container)

  const button = container.querySelector('button')!
  expect(button.disabled).toBe(true)
  props.disabled = false
  await nextTick()
  expect(button.disabled).toBe(false)
  button.click()
  await nextTick()

  const download = vi.mocked(downloadFileWithXhr)
  expect(download).toHaveBeenCalledExactlyOnceWith(
    expect.any(URL),
    'warning-district-2026-11-05T12_00_00.000Z.html',
    headers,
  )
  const url = new URL(download.mock.calls[0][0])
  expect(url.origin).toBe('https://fews.example')
  expect(url.pathname).toBe(
    '/FewsWebServices/rest/fewspiservice/v1/dynamicreportdisplays',
  )
  expect(Object.fromEntries(url.searchParams)).toEqual({
    displayId: 'warning',
    locationId: 'district',
    time: props.time,
    useLastValue: 'true',
  })

  props.locationId = 'other-district'
  props.time = '2026-11-05T13:00:00.000Z'
  await nextTick()
  button.click()
  await nextTick()
  const updatedUrl = new URL(download.mock.calls[1][0])
  expect(updatedUrl.searchParams.get('locationId')).toBe('other-district')
  expect(updatedUrl.searchParams.get('time')).toBe(props.time)

  props.disabled = true
  await nextTick()
  button.click()
  expect(download).toHaveBeenCalledTimes(2)
})
