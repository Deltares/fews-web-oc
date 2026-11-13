// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { resolveCssUrls } from '@/lib/dynamic-report/styles'

vi.mock('@/lib/fews-config', () => ({
  getResourcesStaticUrl: () => 'https://fews.example/resources/',
}))
vi.mock('@/lib/requests/transformRequest', () => ({
  createTransformRequestFn: () => (request: Request) => request,
}))

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
