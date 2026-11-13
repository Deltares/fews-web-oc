// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createPrintCss, printDynamicReport } from '@/lib/dynamic-report/print'
import { createDynamicReportStyleSheets } from '@/lib/dynamic-report/styles'

vi.mock('@/lib/dynamic-report/styles', () => ({
  createDynamicReportStyleSheets: vi.fn(async () => []),
  resolveCssUrls: (css: string) => css,
}))
vi.mock('@/lib/fews-config', () => ({
  getResourcesStaticUrl: () => 'https://fews.example/resources/',
}))

afterEach(() => {
  vi.restoreAllMocks()
  Reflect.deleteProperty(HTMLImageElement.prototype, 'decode')
})

describe('printDynamicReport', () => {
  it('uses CSS page margin boxes for title and page counts without HTML elements', () => {
    const css = createPrintCss('Forecast "report"\nUTC')
    expect(css).toContain('@top-center')
    expect(css).toContain('content: "Forecast \\"report\\" UTC"')
    expect(css).toContain('counter(page) " out of " counter(pages)')
    expect(css).toContain('overflow: visible !important')
    expect(css).toContain('height: auto !important')
    expect(css).toContain('margin: 20mm 0')
    expect(css).toContain('@page :first')
    expect(css).toContain('margin-top: 0')
    expect(css).toContain('content: none')
  })
  it('reports blocked popups', async () => {
    vi.spyOn(window, 'open').mockReturnValue(null)
    await expect(printDynamicReport('<p>report</p>', 'report')).rejects.toThrow(
      'blocked',
    )
  })

  it('does not inherit the application layout and uses the HTML document title', async () => {
    const application = document.createElement('div')
    const previousSheets = Object.getOwnPropertyDescriptor(
      document,
      'adoptedStyleSheets',
    )
    Object.defineProperty(document, 'adoptedStyleSheets', {
      configurable: true,
      value: [],
    })
    application.className = 'v-application d-flex h-100'
    document.body.appendChild(application)
    const target = document.implementation.createHTMLDocument()
    Object.defineProperty(target, 'fonts', {
      value: { ready: Promise.resolve() },
    })
    const replaceSync = vi.fn()
    const tab = {
      document: target,
      CSSStyleSheet: class {
        replaceSync = replaceSync
      },
      closed: false,
      focus: vi.fn(),
      print: vi.fn(),
      close: vi.fn(),
    }
    vi.spyOn(window, 'open').mockReturnValue(tab as unknown as Window)
    try {
      await printDynamicReport(
        '<title>Forecast Bulletin</title><p>Report content</p>',
        'filename',
      )
      expect(target.title).toBe('Forecast Bulletin')
      expect(target.body.className).toBe('')
      expect(target.body.textContent).toBe('Report content')
      expect(target.querySelector('header, footer')).toBeNull()
      expect(replaceSync).toHaveBeenLastCalledWith(
        createPrintCss('Forecast Bulletin'),
      )
      expect(tab.print).toHaveBeenCalledOnce()
    } finally {
      application.remove()
      if (previousSheets) {
        Object.defineProperty(document, 'adoptedStyleSheets', previousSheets)
      } else {
        Reflect.deleteProperty(document, 'adoptedStyleSheets')
      }
    }
  })

  it('prints sanitized report HTML in a new tab after fonts are ready and leaves it open', async () => {
    const target = document.implementation.createHTMLDocument()
    let ready!: () => void
    Object.defineProperty(target, 'fonts', {
      value: {
        ready: new Promise<void>((resolve) => {
          ready = resolve
        }),
      },
    })
    const tab = {
      document: target,
      CSSStyleSheet: class {
        replaceSync = vi.fn()
      },
      closed: false,
      opener: window,
      focus: vi.fn(),
      print: vi.fn(),
      close: vi.fn(),
    }
    const open = vi
      .spyOn(window, 'open')
      .mockReturnValue(tab as unknown as Window)
    const result = printDynamicReport(
      '<meta name="fews-dynamic-report-styling" content="isolated"><p>Edited report</p><script>alert(1)</script>',
      'Report',
    )
    await vi.waitFor(() =>
      expect(target.body.textContent).toBe('Edited report'),
    )
    expect(tab.print).not.toHaveBeenCalled()
    ready()
    await result
    expect(open).toHaveBeenCalledWith('about:blank', '_blank')
    expect(target.title).toBe('Report')
    expect(target.querySelector('script')).toBeNull()
    expect(tab.opener).toBeNull()
    expect(tab.print).toHaveBeenCalledOnce()
    expect(tab.close).not.toHaveBeenCalled()
  })

  it('closes the tab and reports missing report styles', async () => {
    const tab = {
      CSSStyleSheet: class {},
      close: vi.fn(),
    }
    vi.spyOn(window, 'open').mockReturnValue(tab as unknown as Window)
    await expect(
      printDynamicReport(
        '<style>p {color: red}</style><p>report</p>',
        'Report',
      ),
    ).rejects.toThrow('Could not load all report styles')
    expect(createDynamicReportStyleSheets).toHaveBeenLastCalledWith(
      [{ type: 'inline', css: 'p {color: red}' }],
      tab.CSSStyleSheet,
    )
    expect(tab.close).toHaveBeenCalledOnce()
  })

  it('does not print when the user closes the tab during style loading', async () => {
    const tab = {
      CSSStyleSheet: class {},
      closed: true,
      print: vi.fn(),
      close: vi.fn(),
    }
    vi.spyOn(window, 'open').mockReturnValue(tab as unknown as Window)
    await expect(printDynamicReport('<p>report</p>', 'Report')).rejects.toThrow(
      'was closed',
    )
    expect(tab.print).not.toHaveBeenCalled()
  })

  it('waits for screenshot decoding and reports broken images without printing', async () => {
    const target = document.implementation.createHTMLDocument()
    const decode = vi.fn().mockRejectedValue(new Error('Image failed'))
    Object.defineProperty(HTMLImageElement.prototype, 'decode', {
      configurable: true,
      value: decode,
    })
    const tab = {
      document: target,
      CSSStyleSheet: class {
        replaceSync = vi.fn()
      },
      closed: false,
      print: vi.fn(),
      close: vi.fn(),
    }
    vi.spyOn(window, 'open').mockReturnValue(tab as unknown as Window)
    await expect(
      printDynamicReport(
        '<meta name="fews-dynamic-report-styling" content="isolated"><img src="data:image/png;base64,test"><p>Source data and valid time</p>',
        'Report',
      ),
    ).rejects.toThrow('Image failed')
    expect(decode).toHaveBeenCalledOnce()
    expect(target.body.textContent).toBe('Source data and valid time')
    expect(tab.print).not.toHaveBeenCalled()
    expect(tab.close).toHaveBeenCalledOnce()
  })
})
