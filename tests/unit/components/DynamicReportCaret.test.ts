// @vitest-environment jsdom
import { Editor } from '@tiptap/core'
import { afterEach, describe, expect, it } from 'vitest'
import { dynamicReportExtensions } from '@/components/reports/dynamic/dynamicReportExtensions'
import { findReportCaretPosition } from '@/components/reports/dynamic/reportCaret'
import { sanitizeDynamicReport } from '@/lib/dynamic-report/sanitize'

describe('dynamic report initial caret', () => {
  let editor: Editor

  function createEditor(html: string) {
    const container = document.createElement('div')
    container.append(sanitizeDynamicReport(html).fragment)
    editor = new Editor({
      extensions: dynamicReportExtensions,
      content: container.innerHTML,
    })
    return editor
  }

  afterEach(() => editor?.destroy())

  it.each([
    ['explicit paragraph', '<p>Intro</p><p data-editor-caret="0">Target</p>'],
    [
      'first usable marker',
      '<p data-editor-caret="2">Target</p><p data-editor-caret="2">Later</p>',
    ],
    [
      'marked wrapper',
      '<div data-editor-caret="3"><div><h2>Target</h2></div></div>',
    ],
    [
      'marked table',
      '<p>Intro</p><table data-editor-caret="0"><tr><td><p>Target</p></td></tr></table>',
    ],
    [
      'protected marker',
      '<p data-editor-caret="0" data-readonly="true">Fixed</p><p data-editor-caret="1">Target</p>',
    ],
    [
      'protected ancestor',
      '<div data-readonly="true"><p data-editor-caret="0">Fixed</p></div><p data-editor-caret="2">Target</p>',
    ],
    [
      'protected descendants',
      '<div data-editor-caret="1"><p data-readonly="true">Fixed</p><p>Target</p></div>',
    ],
    [
      'fallback with no marker',
      '<p data-readonly="true">Fixed</p><p>Target</p>',
    ],
    [
      'fallback with invalid marker',
      '<p>Target</p><p data-editor-caret="false">Later</p>',
    ],
    [
      'fallback with no usable marker',
      '<p>Target</p><div data-editor-caret="0" data-readonly="true"><p>Fixed</p></div>',
    ],
    [
      'fallback with non-text marker',
      '<p>Target</p><hr data-editor-caret="0"><p>Later</p>',
    ],
    [
      'fallback with inline marker',
      '<p>Target</p><p><span data-editor-caret="0">Later</span></p>',
    ],
    ['empty paragraph', '<p>Intro</p><p data-editor-caret="0"></p>'],
    [
      'numeric order rather than document order',
      '<p data-editor-caret="10">Earlier</p><p data-editor-caret="2">Target</p>',
    ],
    [
      'zero has highest priority',
      '<p data-editor-caret="1">Earlier</p><p data-editor-caret="0">Target</p>',
    ],
    [
      'skip negative priority',
      '<p data-editor-caret="-1">Earlier</p><p data-editor-caret="5">Target</p>',
    ],
    [
      'nested marker with lower priority',
      '<div data-editor-caret="2"><p>Earlier</p><p data-editor-caret="0">Target</p></div>',
    ],
    [
      'parent marker with lower priority',
      '<div data-editor-caret="0"><p data-editor-caret="2">Target</p><p>Later</p></div>',
    ],
  ])(
    'selects the start of the first editable text block: %s',
    (_name, html) => {
      createEditor(html)
      const original = editor.state.doc
      const position = findReportCaretPosition(original)
      expect(position).toBeDefined()
      editor.commands.setTextSelection(position!)
      expect(editor.state.selection.empty).toBe(true)
      expect(editor.state.selection.$from.parentOffset).toBe(0)
      expect(editor.state.selection.$from.parent.textContent).toBe(
        html.includes('Target') ? 'Target' : '',
      )
      expect(editor.state.doc).toBe(original)
    },
  )

  it('does not request focus when all text blocks are read-only', () => {
    createEditor(
      '<div data-readonly="true"><p data-editor-caret="0">Fixed</p></div>',
    )
    expect(findReportCaretPosition(editor.state.doc)).toBeUndefined()
  })

  it('preserves the marker through sanitization, serialization and reload', () => {
    createEditor(
      '<p>Intro</p><div data-editor-caret="2" class="commentary"><p>Target</p></div>',
    )
    const original = editor.getJSON()
    const position = findReportCaretPosition(editor.state.doc)
    const html = editor.getHTML()
    expect(html).toContain('data-editor-caret="2"')
    expect(html).toContain('class="commentary"')
    editor.destroy()
    createEditor(html)
    expect(editor.getJSON()).toEqual(original)
    expect(findReportCaretPosition(editor.state.doc)).toBe(position)
  })

  it('does not copy the caret marker when adding a paragraph at the end', () => {
    createEditor('<p data-editor-caret="0">Commentary</p>')
    editor.commands.setTextSelection(editor.state.doc.firstChild!.nodeSize - 1)
    editor.commands.splitBlock()
    const output = new DOMParser().parseFromString(
      editor.getHTML(),
      'text/html',
    )
    expect(output.querySelectorAll('p')).toHaveLength(2)
    expect(output.querySelectorAll('[data-editor-caret="0"]')).toHaveLength(1)
  })

  it.each([
    'true',
    '',
    '-1',
    '1.5',
    'Infinity',
    'NaN',
    '1e2',
    '2text',
    '9007199254740992',
  ])('ignores unusable priority %s for initial focus', (value) => {
    createEditor(`<p>Fallback</p><p data-editor-caret="${value}">Ignored</p>`)
    const position = findReportCaretPosition(editor.state.doc)
    expect(position).toBe(1)
  })

  it('retains a negative priority through export without choosing it', () => {
    createEditor(
      '<p data-editor-caret="-1">Fallback</p><p data-editor-caret="3">Target</p>',
    )
    expect(editor.getHTML()).toContain('data-editor-caret="-1"')
    editor.commands.setTextSelection(findReportCaretPosition(editor.state.doc)!)
    expect(editor.state.selection.$from.parent.textContent).toBe('Target')
  })
})
