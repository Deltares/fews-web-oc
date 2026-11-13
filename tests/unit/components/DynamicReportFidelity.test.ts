// @vitest-environment jsdom
import { Editor } from '@tiptap/vue-3'
import { describe, expect, it } from 'vitest'
import { dynamicReportExtensions } from '@/components/reports/dynamic/dynamicReportExtensions'

describe('dynamic report editor fidelity', () => {
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
})
