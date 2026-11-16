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
  it('transforms inline and linked CSS together before parsing and retains each URL base', async () => {
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
          { type: 'inline', css: '#title { string-set: title content(text) }' },
          { type: 'resource', resource: 'css/report.css' },
        ],
        StyleSheet as typeof CSSStyleSheet,
        false,
        (styles) => styles.map((css) => css.replace('string-set', '--test')),
      )
      expect(fetch).toHaveBeenCalledOnce()
      expect(parsed[0]).toContain('--test: title')
      expect(parsed.at(-1)).toContain(
        'url("https://fews.example/resources/css/legend.png")',
      )
    } finally {
      fetch.mockRestore()
    }
  })
})

describe('resolveCssUrls', () => {
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
