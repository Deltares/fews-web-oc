/**
 * @vitest-environment jsdom
 */

import { describe, expect, it } from 'vitest'
import {
  DYNAMIC_REPORT_SCOPE,
  sanitizeDynamicReport,
  scopeCss,
  toStaticResourcePath,
} from '../../../src/lib/dynamic-report/sanitize'
import {
  findDynamicReportNodes,
  getEditKey,
} from '../../../src/lib/dynamic-report/nodes'

function toContainer(html: string): HTMLDivElement {
  const container = document.createElement('div')
  container.replaceChildren(sanitizeDynamicReport(html).fragment)
  return container
}

describe('sanitizeDynamicReport', () => {
  it('fits screenshots without changing their encoded pixels or other images', () => {
    const source = 'data:image/png;base64,eA=='
    const container = toContainer(
      `<img data-report-screenshot="true" src="${source}" width="1920" height="1080" style="width: 1920px !important; height: 1080px; border: 1px solid red"><img src="${source}" width="200">`,
    )
    const [screenshot, other] = container.querySelectorAll('img')
    expect(screenshot.src).toBe(source)
    expect(screenshot.style.width).toBe('auto')
    expect(screenshot.style.maxWidth).toBe('100%')
    expect(screenshot.style.height).toBe('auto')
    expect(screenshot.style.getPropertyPriority('max-width')).toBe('important')
    expect(screenshot.style.border).toBe('1px solid red')
    expect(screenshot.getAttribute('width')).toBe('1920')
    expect(other.getAttribute('width')).toBe('200')
    expect(other.getAttribute('style')).toBeNull()
  })

  it('removes scripts and event handlers but keeps data attributes', () => {
    const container = toContainer(
      '<script>alert(1)</script><span data-input-type="number" onclick="alert(1)">1</span>',
    )
    expect(container.querySelector('script')).toBeNull()
    const span = container.querySelector('span')
    expect(span?.getAttribute('onclick')).toBeNull()
    expect(span?.dataset.inputType).toBe('number')
  })

  it('extracts style elements and style sheet links in document order', () => {
    const { fragment, styles } = sanitizeDynamicReport(
      `<html><head>
        <link rel="stylesheet" href="css/report.css">
        <link rel="icon" href="favicon.ico">
        <style>p { margin: 0; }</style>
      </head><body><p>x</p><style>table { color: red; }</style></body></html>`,
    )
    expect(styles).toEqual([
      { type: 'resource', resource: 'css/report.css' },
      { type: 'inline', css: 'p { margin: 0; }' },
      { type: 'inline', css: 'table { color: red; }' },
    ])
    expect(fragment.querySelector('style, link')).toBeNull()
    expect(fragment.querySelector('p')?.textContent).toBe('x')
  })

  it('never returns style and link elements, also when nested', () => {
    const { fragment, styles } = sanitizeDynamicReport(
      `<div><section>
        <style>td { color: red; }</style>
        <link rel="stylesheet" href="css/nested.css">
        <link rel="preload" href="https://example.com/a.css">
      </section><p>x</p></div>`,
    )
    expect(styles).toEqual([
      { type: 'inline', css: 'td { color: red; }' },
      { type: 'resource', resource: 'css/nested.css' },
    ])
    expect(fragment.querySelector('style, link')).toBeNull()
    expect(fragment.querySelector('p')?.textContent).toBe('x')
  })

  it('ignores style sheet links that are not FEWS static resources', () => {
    const { styles } = sanitizeDynamicReport(
      '<link rel="stylesheet" href="https://example.com/a.css">',
    )
    expect(styles).toEqual([])
  })

  it('uses isolated styling by default', () => {
    expect(sanitizeDynamicReport('<p>x</p>').styling).toBe('isolated')
  })

  it('reads the WebOC styling option from the meta element', () => {
    expect(
      sanitizeDynamicReport(
        '<meta name="fews-dynamic-report-styling" content=" WebOC ">',
      ).styling,
    ).toBe('weboc')
  })

  it('reads the isolated styling option from the meta element', () => {
    const { fragment, styling } = sanitizeDynamicReport(
      '<html><head><meta name="fews-dynamic-report-styling" content=" Isolated "></head><body><p>x</p></body></html>',
    )
    expect(styling).toBe('isolated')
    expect(fragment.querySelector('meta')).toBeNull()
  })

  it('uses isolated styling for unknown styling options', () => {
    expect(
      sanitizeDynamicReport(
        '<meta name="fews-dynamic-report-styling" content="other">',
      ).styling,
    ).toBe('isolated')
  })

  it('returns no styles when there are none', () => {
    expect(sanitizeDynamicReport('<p>x</p>').styles).toEqual([])
  })
})

describe('scopeCss', () => {
  it('wraps the css in a scope for the report container', () => {
    expect(scopeCss('table { color: red; }')).toBe(
      `@scope (${DYNAMIC_REPORT_SCOPE}) {\ntable { color: red; }\n}`,
    )
  })
})

describe('toStaticResourcePath', () => {
  it('normalizes relative paths', () => {
    expect(toStaticResourcePath('css/report.css')).toBe('css/report.css')
    expect(toStaticResourcePath('./css/report.css')).toBe('css/report.css')
    expect(toStaticResourcePath('/css/report.css')).toBe('css/report.css')
    expect(toStaticResourcePath('css/../my report.css')).toBe('my report.css')
  })

  it('rejects absolute and empty urls', () => {
    expect(toStaticResourcePath('https://example.com/a.css')).toBeUndefined()
    expect(toStaticResourcePath('//example.com/a.css')).toBeUndefined()
    expect(toStaticResourcePath('data:text/css,p{}')).toBeUndefined()
    expect(toStaticResourcePath('')).toBeUndefined()
  })
})

describe('findDynamicReportNodes', () => {
  it('parses the data attributes and takes the text content as value', () => {
    const container = toContainer(
      `<table><tr><td>
        <span data-input-type="number" data-time-series-index="3f2b9c1e-7a4d:hourly"
              data-time="2026-10-27T06:00:00Z"> 12.3 </span>
      </td></tr></table>`,
    )
    const nodes = findDynamicReportNodes(container)

    expect(nodes).toHaveLength(1)
    expect(nodes[0]).toMatchObject({
      key: '0',
      inputType: 'number',
      timeSeriesIndex: '3f2b9c1e-7a4d:hourly',
      time: '2026-10-27T06:00:00Z',
      value: '12.3',
    })
    expect(nodes[0].element.tagName).toBe('SPAN')
    expect(nodes[0].element.childNodes).toHaveLength(0)
  })

  it('skips elements with missing or invalid attributes', () => {
    const container = toContainer(
      `<span data-input-type="number" data-time="t">a</span>
       <span data-input-type="number" data-time-series-index="" data-time="t">b</span>
       <span data-input-type="number" data-time-series-index="0">c</span>`,
    )
    const nodes = findDynamicReportNodes(container)

    expect(nodes).toHaveLength(0)
    expect(container.textContent?.replace(/\s/g, '')).toBe('abc')
  })
})

describe('getEditKey', () => {
  it('combines time series index and time', () => {
    expect(getEditKey({ timeSeriesIndex: 'a', time: 't' })).toBe('a|t')
  })
})
