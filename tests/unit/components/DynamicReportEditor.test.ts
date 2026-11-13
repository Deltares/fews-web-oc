// @vitest-environment jsdom
import { createApp, h, nextTick, ref } from 'vue'
import { createI18n } from 'vue-i18n'
import { afterEach, describe, expect, it, vi } from 'vitest'
import DynamicReportContent from '@/components/reports/DynamicReportContent.vue'
import { createDynamicReportStyleSheets } from '@/lib/dynamic-report/styles'

vi.mock('@/services/useDark', () => ({ useDark: () => ref(false) }))
vi.mock('@/lib/dynamic-report/styles', () => ({
  createDynamicReportStyleSheets: vi.fn(async () => []),
}))

class TestStyleSheet {
  replaceSync() {}
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('editable dynamic report content', () => {
  it('renders input nodes in an editor, emits changes, and resets for a new report', async () => {
    vi.stubGlobal('CSSStyleSheet', TestStyleSheet)
    const previousSheets = Object.getOwnPropertyDescriptor(
      document,
      'adoptedStyleSheets',
    )
    Object.defineProperty(document, 'adoptedStyleSheets', {
      configurable: true,
      writable: true,
      value: [],
    })
    const html = ref(
      '<p><span data-input-type="number" data-time-series-index="0" data-time="2026-10-27T06:00:00Z">12.3</span></p>',
    )
    const updated = vi.fn()
    const report = ref<InstanceType<typeof DynamicReportContent>>()
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp({
      render: () =>
        h(DynamicReportContent, {
          html: html.value,
          editable: true,
          onUpdate: updated,
          ref: report,
        }),
    })
    app.use(
      createI18n({
        legacy: false,
        locale: 'en',
        messages: {
          en: {
            dynamicReport: {
              valueInputLabel: 'Value at {time}',
              valueInputPlaceholder: 'Value',
            },
          },
        },
      }),
    )
    try {
      app.mount(host)
      await vi.waitFor(() => expect(host.querySelector('input')).not.toBeNull())
      const input = host.querySelector('input')!
      expect(input.value).toBe('12.3')
      input.value = '42'
      input.dispatchEvent(new Event('input', { bubbles: true }))
      await vi.waitFor(() =>
        expect(updated).toHaveBeenLastCalledWith(
          expect.stringContaining('>42</span>'),
        ),
      )

      await report.value!.insertScreenshot(
        new Blob(['screenshot'], { type: 'image/png' }),
        'Selected node',
        'Source data: rainfall. Valid time: 2026-11-13T06:00:00Z (UTC).',
      )
      await report.value!.insertScreenshot(
        new Blob(['second'], { type: 'image/png' }),
        'Second node',
      )
      await vi.waitFor(() =>
        expect(
          host.querySelectorAll('img[data-report-screenshot="true"]'),
        ).toHaveLength(2),
      )
      expect(updated).toHaveBeenLastCalledWith(
        expect.stringContaining('data:image/png;base64,'),
      )

      const saved = updated.mock.lastCall?.[0]
      expect(saved).toContain(
        '<p>Source data: rainfall. Valid time: 2026-11-13T06:00:00Z (UTC).</p>',
      )
      expect(saved).toContain('data-report-screenshot="true"')
      const savedImage = new DOMParser()
        .parseFromString(saved, 'text/html')
        .querySelector('img')!
      expect(savedImage.getAttribute('src')).toBe(
        `data:image/png;base64,${btoa('screenshot')}`,
      )
      expect(savedImage.style.width).toBe('auto')
      expect(savedImage.style.maxWidth).toBe('100%')
      expect(savedImage.style.height).toBe('auto')
      html.value = saved
      await nextTick()
      await vi.waitFor(() =>
        expect(
          host.querySelectorAll('img[data-report-screenshot="true"]'),
        ).toHaveLength(2),
      )

      html.value = '<p>New report</p>'
      await nextTick()
      await vi.waitFor(() => expect(host.textContent).toContain('New report'))
      expect(host.querySelector('input')).toBeNull()
      expect(host.querySelectorAll('img')).toHaveLength(0)

      html.value = `<p>${'<img src="data:image/png;base64,eA==" data-report-screenshot="true">'.repeat(20)}</p>`
      await vi.waitFor(() =>
        expect(
          host.querySelectorAll('img[data-report-screenshot="true"]'),
        ).toHaveLength(20),
      )
      await expect(
        report.value!.insertScreenshot(
          new Blob(['extra'], { type: 'image/png' }),
          'Extra',
        ),
      ).rejects.toThrow('cannot contain more than 20 screenshots')
      expect(
        host.querySelectorAll('img[data-report-screenshot="true"]'),
      ).toHaveLength(20)
    } finally {
      app.unmount()
      host.remove()
      if (previousSheets) {
        Object.defineProperty(document, 'adoptedStyleSheets', previousSheets)
      } else {
        Reflect.deleteProperty(document, 'adoptedStyleSheets')
      }
    }
  })

  it('rejects a screenshot when the report editor is not enabled', async () => {
    vi.stubGlobal('CSSStyleSheet', TestStyleSheet)
    const previousSheets = Object.getOwnPropertyDescriptor(
      document,
      'adoptedStyleSheets',
    )
    Object.defineProperty(document, 'adoptedStyleSheets', {
      configurable: true,
      writable: true,
      value: [],
    })
    const report = ref<InstanceType<typeof DynamicReportContent>>()
    const host = document.createElement('div')
    const app = createApp({
      render: () => h(DynamicReportContent, { html: '', ref: report }),
    })
    app.mount(host)
    try {
      await vi.waitFor(() =>
        expect(host.querySelector('.dynamic-report')).not.toBeNull(),
      )
      await expect(
        report.value!.insertScreenshot(
          new Blob(['x'], { type: 'image/png' }),
          '',
        ),
      ).rejects.toThrow('The report editor is not ready')
    } finally {
      app.unmount()
      if (previousSheets) {
        Object.defineProperty(document, 'adoptedStyleSheets', previousSheets)
      } else {
        Reflect.deleteProperty(document, 'adoptedStyleSheets')
      }
    }
  })

  it('uses the original report styles when displaying an edited body', async () => {
    vi.stubGlobal('CSSStyleSheet', TestStyleSheet)
    const previousSheets = Object.getOwnPropertyDescriptor(
      document,
      'adoptedStyleSheets',
    )
    Object.defineProperty(document, 'adoptedStyleSheets', {
      configurable: true,
      writable: true,
      value: [],
    })
    const host = document.createElement('div')
    const app = createApp({
      render: () =>
        h(DynamicReportContent, {
          html: '<p>Edited report</p>',
          styleHtml:
            '<body><style>.report { color: red }</style><p>Original</p></body>',
        }),
    })
    try {
      app.mount(host)
      await vi.waitFor(() =>
        expect(host.textContent).toContain('Edited report'),
      )
      expect(createDynamicReportStyleSheets).toHaveBeenLastCalledWith([
        { type: 'inline', css: '.report { color: red }' },
      ])
    } finally {
      app.unmount()
      if (previousSheets) {
        Object.defineProperty(document, 'adoptedStyleSheets', previousSheets)
      } else {
        Reflect.deleteProperty(document, 'adoptedStyleSheets')
      }
    }
  })
})
