// @vitest-environment jsdom
import { Editor } from '@tiptap/core'
import Document from '@tiptap/extension-document'
import Paragraph from '@tiptap/extension-paragraph'
import Text from '@tiptap/extension-text'
import { EditorContent } from '@tiptap/vue-3'
import { createApp, h } from 'vue'
import { createI18n } from 'vue-i18n'
import { describe, expect, it, vi } from 'vitest'
import { DynamicReportInput } from '@/components/reports/dynamic/dynamicReportInput'
import { dynamicReportExtensions } from '@/components/reports/dynamic/dynamicReportExtensions'
import { sanitizeDynamicReport } from '@/lib/dynamic-report/sanitize'

describe('dynamic report input node', () => {
  it('preserves input metadata and values in the editor document and HTML', () => {
    const editor = new Editor({
      extensions: [Document, Paragraph, Text, DynamicReportInput],
      content:
        '<p>Value: <span data-input-type="number" data-time-series-index="0" data-time="2026-10-27T06:00:00Z">12.3</span></p>',
    })
    try {
      expect(editor.getJSON().content?.[0].content?.[1]).toMatchObject({
        type: 'dynamicReportInput',
        attrs: {
          inputType: 'number',
          timeSeriesIndex: '0',
          time: '2026-10-27T06:00:00Z',
          value: '12.3',
        },
      })
      const element = document.createElement('div')
      element.innerHTML = editor.getHTML()
      const input = element.querySelector('span[data-input-type]')
      expect(input?.getAttribute('data-time-series-index')).toBe('0')
      expect(input?.getAttribute('data-time')).toBe('2026-10-27T06:00:00Z')
      expect(input?.textContent).toBe('12.3')
    } finally {
      editor.destroy()
    }
  })

  it('does not convert input markup with missing metadata', () => {
    const editor = new Editor({
      extensions: [Document, Paragraph, Text, DynamicReportInput],
      content: '<p><span data-input-type="number">12.3</span></p>',
    })
    try {
      expect(editor.getJSON().content?.[0].content?.[0]).toMatchObject({
        type: 'text',
        text: '12.3',
      })
    } finally {
      editor.destroy()
    }
  })

  it('retains inline screenshots and input nodes after sanitizing and reloading', () => {
    const source =
      '<p><span class="report-value" data-extra="test" data-input-type="number" data-time-series-index="0" data-time="2026-10-27T06:00:00Z">12.3</span><img src="data:image/png;base64,AAH+/w==" alt="Map"></p>'
    const container = document.createElement('div')
    container.append(sanitizeDynamicReport(source).fragment)
    const editor = new Editor({
      extensions: dynamicReportExtensions,
      content: container.innerHTML,
    })
    try {
      const output = document.createElement('div')
      output.innerHTML = editor.getHTML()
      expect(output.querySelector('img')?.getAttribute('src')).toBe(
        'data:image/png;base64,AAH+/w==',
      )
      expect(output.querySelector('[data-input-type]')?.textContent).toBe(
        '12.3',
      )
      expect(output.querySelector('[data-input-type]')?.className).toBe(
        'report-value',
      )
      expect(
        output.querySelector('[data-input-type]')?.getAttribute('data-extra'),
      ).toBe('test')
      const reloaded = new Editor({
        extensions: dynamicReportExtensions,
        content: editor.getHTML(),
      })
      try {
        expect(reloaded.getJSON()).toEqual(editor.getJSON())
      } finally {
        reloaded.destroy()
      }
    } finally {
      editor.destroy()
    }
  })

  it('updates the document from the Vue input and restores it on undo', async () => {
    const editor = new Editor({
      extensions: dynamicReportExtensions,
      content:
        '<p><span data-input-type="number" data-time-series-index="0" data-time="2026-10-27T06:00:00Z">12.3</span></p>',
    })
    const element = document.createElement('div')
    document.body.appendChild(element)
    const app = createApp({ render: () => h(EditorContent, { editor }) })
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
      app.mount(element)
      await vi.waitFor(() =>
        expect(element.querySelector('input')).not.toBeNull(),
      )
      const input = element.querySelector('input')!
      expect(input.value).toBe('12.3')
      input.value = '42'
      input.dispatchEvent(new Event('input', { bubbles: true }))
      await vi.waitFor(() => expect(editor.getHTML()).toContain('>42</span>'))
      expect(editor.commands.undo()).toBe(true)
      await vi.waitFor(() => expect(input.value).toBe('12.3'))
    } finally {
      app.unmount()
      editor.destroy()
      element.remove()
    }
  })
})
