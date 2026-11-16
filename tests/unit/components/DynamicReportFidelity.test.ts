// @vitest-environment jsdom
import { Editor } from '@tiptap/vue-3'
import { describe, expect, it } from 'vitest'
import { dynamicReportExtensions } from '@/components/reports/dynamic/dynamicReportExtensions'
import governorateReport from '../../fixtures/dynamic-report/DynamicReportGovernoratePerLocationTemplate.html?raw'
import districtReport from '../../fixtures/dynamic-report/DynamicReportDistrictInundationPerLocationTemplate.html?raw'

describe('dynamic report editor fidelity', () => {
  it('uses the district event collection in page headers and scopes the report header', () => {
    const source = new DOMParser().parseFromString(districtReport, 'text/html')
    const printStyles = source.querySelector('style[media="print"]')
    expect(printStyles?.getAttribute('th:inline')).toBe('css')
    expect(printStyles?.textContent).toContain('event[0].governorate_name')
    expect(printStyles?.textContent).toContain('event[0].district_name')
    expect(printStyles?.textContent).not.toContain('eventRecord.')
    const header = source.querySelector('.report-header')
    expect(header?.getAttribute('th:each')).toBe('eventRecord : ${event}')
    expect(header?.getAttribute('th:with')).toContain(
      'eventRecord.event_probability <= 15',
    )
  })

  it('retains report header, inline formatting and table header attributes after an edit', () => {
    const editor = new Editor({
      extensions: dynamicReportExtensions,
      content: `<article class="report">
        <header class="heading" style="color: red"><p>Forecast</p></header>
        <p>Alert: <span class="severity" data-level="warning" style="color: orange">High</span></p>
        <table class="report-table"><thead><tr><th scope="col">Location</th></tr></thead>
        <tbody><tr><td class="value">Cairo</td></tr></tbody></table>
      </article>`,
    })
    try {
      editor.commands.insertContentAt(1, '<p>New text</p>')
      const document = new DOMParser().parseFromString(
        editor.getHTML(),
        'text/html',
      )
      expect(document.querySelector('article')?.className).toBe('report')
      const header = document.querySelector('header')
      expect(header?.className).toBe('heading')
      expect(header?.style.color).toBe('red')
      expect(header?.hasAttribute('contenteditable')).toBe(false)
      const severity = document.querySelector('span.severity')
      expect(severity?.textContent).toBe('High')
      expect(severity?.getAttribute('style')).toContain('color: orange')
      expect(severity?.dataset.level).toBe('warning')
      expect(document.querySelector('th')?.getAttribute('scope')).toBe('col')
      expect(document.querySelector('td.value')?.textContent).toBe('Cairo')
      expect(document.body.textContent).toContain('New text')
    } finally {
      editor.destroy()
    }
  })

  for (const [name, html] of [
    ['governorate', governorateReport],
    ['district', districtReport],
  ]) {
    it(`retains ${name} table header cells and classes through an edit`, () => {
      const source = new DOMParser().parseFromString(html, 'text/html')
      const editor = new Editor({
        extensions: dynamicReportExtensions,
        content: source.body.innerHTML,
      })
      try {
        expect(source.querySelector('.report-body thead th')).not.toBeNull()
        expect(
          editor.view.dom.querySelector('.report-body table th'),
        ).not.toBeNull()
        expect(
          editor.view.dom.querySelector('.report-body table thead'),
        ).toBeNull()
        editor.commands.insertContentAt(1, '<p>Edited</p>')
        const result = new DOMParser().parseFromString(
          editor.getHTML(),
          'text/html',
        )
        expect(result.querySelector('.report-body table th')).not.toBeNull()
        expect(result.querySelector('.report-body table')?.className).toBe(
          'ensemble-table',
        )
      } finally {
        editor.destroy()
      }
    })
  }
})
