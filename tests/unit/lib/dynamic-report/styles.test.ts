// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import {
  createDynamicReportStyleSheets,
  resolveCssUrls,
} from '@/lib/dynamic-report/styles'

vi.mock('@/lib/fews-config', () => ({
  getResourcesStaticUrl: (path = '') =>
    `https://fews.example/resources/${path}`,
}))
vi.mock('@/lib/requests/transformRequest', () => ({
  createTransformRequestFn: () => (request: Request) => request,
}))

describe('createDynamicReportStyleSheets', () => {
  it('loads inline and linked CSS in order and retains each URL base', async () => {
    const fetch = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response('.linked { background: url(legend.png) }'),
      )
    const parsed: string[] = []
    class StyleSheet {
      cssRules: { cssText: string }[] = []
      replaceSync(css: string) {
        parsed.push(css)
        this.cssRules = [{ cssText: css }]
      }
    }
    try {
      await createDynamicReportStyleSheets(
        [
          { type: 'inline', css: '#title { color: red }' },
          { type: 'resource', resource: 'css/report.css' },
        ],
        StyleSheet as typeof CSSStyleSheet,
        false,
      )
      expect(fetch).toHaveBeenCalledOnce()
      expect(parsed[0]).toContain('color: red')
      expect(parsed.at(-1)).toContain(
        'url("https://fews.example/resources/css/legend.png")',
      )
    } finally {
      fetch.mockRestore()
    }
  })
})

describe('resolveCssUrls', () => {
  it('skips escaped strings, comments and non-URL identifiers', () => {
    const css = `p {content: "escaped \\" url(foo)"; --text: 'url(bar)'; background: myurl(foo)} /* url(comment) */`
    expect(resolveCssUrls(css, 'https://fews.example/')).toBe(css)
  })

  it('supports uppercase URLs, whitespace and escaped unquoted paths', () => {
    expect(
      resolveCssUrls(
        'p {background: URL(  map\\(1\\).png  )}',
        'https://fews.example/resources/',
      ),
    ).toBe('p {background: url("https://fews.example/resources/map(1).png")}')
  })

  it('preserves unterminated tokens without repeatedly scanning their contents', () => {
    const css = 'p {background: url(' + 'url('.repeat(25000)
    expect(resolveCssUrls(css, 'https://fews.example/')).toBe(css)
    expect(resolveCssUrls('/* url(foo)', 'https://fews.example/')).toBe(
      '/* url(foo)',
    )
    expect(resolveCssUrls('"url(foo)', 'https://fews.example/')).toBe(
      '"url(foo)',
    )
  })

  it('preserves relative stylesheet assets when CSS is serialized into another document', () => {
    expect(
      resolveCssUrls(
        'p {background: url("../legend.png")} @font-face {src: url(font.woff2)}',
        'https://fews.example/resources/css/report.css',
      ),
    ).toBe(
      'p {background: url("https://fews.example/resources/legend.png")} @font-face {src: url("https://fews.example/resources/css/font.woff2")}',
    )
  })

  it('leaves text, comments and data URLs unchanged', () => {
    const css =
      'p {content: "url(foo)"; background: url("data:image/png;base64,abc")} /* url(foo) */'
    expect(resolveCssUrls(css, 'https://fews.example/')).toBe(css)
  })

  it('resolves quoted paths with parentheses and CSS escapes', () => {
    expect(
      resolveCssUrls(
        'p {background: url("map (1)\\20 legend.png")}',
        'https://fews.example/resources/',
      ),
    ).toBe(
      'p {background: url("https://fews.example/resources/map%20(1)%20legend.png")}',
    )
  })
})
