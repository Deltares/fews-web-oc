// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { resolvePrintNamedStrings } from '@/lib/dynamic-report/printNamedStrings'

function fragment(html: string): DocumentFragment {
  const template = document.createElement('template')
  template.innerHTML = html
  return template.content
}

describe('print named strings fallback', () => {
  it('resolves nested selectors across style sheets without changing other content', () => {
    const styles = [
      `.report-header {
        #title { string-set: report-title content(text); }
        #governorate { string-set: governorate content(); }
      }`,
      `@page {
        @top-left { content: 'Governorate: ' string(governorate); }
        @top-center { content: string(report-title); }
        @bottom-center { content: "Page " counter(page) " of " counter(pages); }
      }
      @page :first { @top-center { content: none; } }
      p { content: "string(report-title)"; }`,
    ]
    const report = fragment(
      '<div class="report-header"><h1 id="title">  Flood   report </h1><span id="governorate">Kafr El Sheikh</span></div>',
    )
    const result = resolvePrintNamedStrings(styles, report)
    expect(result[1]).toContain(`content: 'Governorate: ' "Kafr El Sheikh"`)
    expect(result[1]).toContain('content: "Flood report"')
    expect(result[1]).toContain('counter(page) " of " counter(pages)')
    expect(result[1]).toContain('@top-center { content: none; }')
    expect(result[1]).toContain('content: "string(report-title)"')
    expect(styles[1]).toContain('string(governorate)')
  })

  it('escapes CSS strings and ignores comments and quoted functions', () => {
    const [css] = resolvePrintNamedStrings(
      [
        `#x { string-set: title content(text) }
        @page { @top-center { content: 'string(title)' /* string(title) */ string(title) } }`,
      ],
      fragment('<p id="x">A "quote" and \\ slash</p>'),
    )
    expect(css).toContain(
      `content: 'string(title)' /* string(title) */ "A \\"quote\\" and \\\\ slash"`,
    )
  })

  it('resolves adjacent functions without changing other function names', () => {
    const [css] = resolvePrintNamedStrings(
      [
        '#a { string-set: first content() } #b { string-set: second content() } @page { @top-center { content: string(first)string(second) my-string(first) } }',
      ],
      fragment('<p id="a">One</p><p id="b">Two</p>'),
    )
    expect(css).toContain('content: "One""Two" my-string(first)')
  })

  it('chooses the first matching value in document order and warns on changes', () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      const [css] = resolvePrintNamedStrings(
        [
          '.later { string-set: title content(text) } .first { string-set: title content(text) } @page { @top-center { content: string(title) } }',
        ],
        fragment('<p class="first">First</p><p class="later">Later</p>'),
      )
      expect(css).toContain('content: "First"')
      expect(warning).toHaveBeenCalled()
    } finally {
      warning.mockRestore()
    }
  })

  it('warns when a named string cannot be resolved', () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      const [css] = resolvePrintNamedStrings(
        ['@page { @top-center { content: string(missing) } }'],
        fragment('<p>Report</p>'),
      )
      expect(css).toContain('content: string(missing)')
      expect(warning).toHaveBeenCalledWith(
        'No report element found for print named string "missing"',
      )
    } finally {
      warning.mockRestore()
    }
  })
})
