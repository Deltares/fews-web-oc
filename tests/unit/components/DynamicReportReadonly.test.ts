// @vitest-environment jsdom
import { Editor } from '@tiptap/core'
import type { Node } from '@tiptap/pm/model'
import { TextSelection } from '@tiptap/pm/state'
import { afterEach, describe, expect, it } from 'vitest'
import { dynamicReportExtensions } from '@/components/reports/dynamic/dynamicReportExtensions'
import { isReadonlyReportPosition } from '@/components/reports/dynamic/reportReadonly'
import { sanitizeDynamicReport } from '@/lib/dynamic-report/sanitize'

const source = `<article class="report">
  <p id="intro">Before</p>
  <div id="fixed" data-readonly="true" class="forecast">
    <h2>Forecast</h2><p>Alert: <strong>High</strong></p>
  </div>
  <p id="commentary">After</p>
</article>`

describe('read-only report sections', () => {
  let editor: Editor

  function createEditor(html = source) {
    const container = document.createElement('div')
    container.append(sanitizeDynamicReport(html).fragment)
    editor = new Editor({
      extensions: dynamicReportExtensions,
      content: container.innerHTML,
    })
    return editor
  }

  function findNode(id: string): { node: Node; pos: number } {
    let result: { node: Node; pos: number } | undefined
    editor.state.doc.descendants((node, pos) => {
      if (node.attrs.id === id) result = { node, pos }
    })
    if (!result) throw new Error(`Missing report node: ${id}`)
    return result
  }

  afterEach(() => editor?.destroy())

  it('preserves the marker, block structure and attributes through sanitization and reload', () => {
    createEditor()
    const element = editor.view.dom.querySelector('#fixed')!
    expect(element.tagName).toBe('DIV')
    expect(element.getAttribute('contenteditable')).toBe('false')
    expect(element.className).toBe('forecast')
    expect(element.querySelector('h2')?.textContent).toBe('Forecast')
    expect(element.querySelector('strong')?.textContent).toBe('High')
    expect(
      editor.view.dom
        .querySelector('#commentary')
        ?.hasAttribute('contenteditable'),
    ).toBe(false)
    const saved = editor.getJSON()
    const html = editor.getHTML()
    editor.destroy()
    createEditor(html)
    expect(editor.getJSON()).toEqual(saved)
    expect(findNode('fixed').node.attrs.reportReadonly).toBe(true)
    const before = editor.state.doc
    editor.commands.deleteRange({
      from: findNode('fixed').pos,
      to: findNode('fixed').pos + findNode('fixed').node.nodeSize,
    })
    expect(editor.state.doc).toBe(before)
  })

  it.each(['p', 'header', 'article', 'div', 'h2', 'blockquote'])(
    'protects a supported %s block, not just division wrappers',
    (tag) => {
      const content = ['p', 'h2'].includes(tag) ? 'Fixed' : '<p>Fixed</p>'
      createEditor(
        `<${tag} id="fixed" data-readonly="true">${content}</${tag}><p>After</p>`,
      )
      let found = false
      editor.state.doc.descendants((node, pos) => {
        if (node.attrs.reportReadonly !== true) return
        found = true
        const before = editor.state.doc
        editor.commands.deleteRange({ from: pos, to: pos + node.nodeSize })
        expect(editor.state.doc).toBe(before)
        return false
      })
      expect(found).toBe(true)
    },
  )

  it('protects table cells and their attributes', () => {
    createEditor(
      '<table><tr><td id="fixed" data-readonly="true"><p>Fixed</p></td><td><p>Editable</p></td></tr></table>',
    )
    const { node, pos } = findNode('fixed')
    const before = editor.state.doc
    editor.view.dispatch(editor.state.tr.insertText('Changed', pos + 2))
    expect(editor.state.doc).toBe(before)
    editor.view.dispatch(
      editor.state.tr.setNodeMarkup(pos, undefined, {
        ...node.attrs,
        colspan: 2,
      }),
    )
    expect(editor.state.doc).toBe(before)
  })

  it.each([
    ['missing', ''],
    ['false', 'data-readonly="false"'],
  ])('leaves %s protection markers editable', (_name, attribute) => {
    createEditor(`<p id="fixed" ${attribute}>Editable</p>`)
    editor.view.dispatch(
      editor.state.tr.insertText('More ', findNode('fixed').pos + 1),
    )
    expect(editor.state.doc.textContent).toBe('More Editable')
  })

  it('allows edits on both sides, selection changes, undo and redo', () => {
    createEditor()
    const protectedNode = findNode('fixed').node
    const { pos: after } = findNode('commentary')
    editor.commands.setTextSelection(after + 1)
    editor.commands.insertContent('New ')
    editor.view.dispatch(
      editor.state.tr.insertText('New ', findNode('intro').pos + 1),
    )
    expect(findNode('commentary').node.textContent).toBe('New After')
    expect(findNode('intro').node.textContent).toBe('New Before')
    expect(findNode('fixed').node.eq(protectedNode)).toBe(true)
    expect(editor.commands.undo()).toBe(true)
    expect(editor.commands.undo()).toBe(true)
    expect(findNode('commentary').node.textContent).toBe('After')
    expect(findNode('intro').node.textContent).toBe('Before')
    expect(editor.commands.redo()).toBe(true)
    expect(editor.commands.redo()).toBe(true)
    expect(findNode('fixed').node.eq(protectedNode)).toBe(true)
  })

  it.each(['insert', 'replace', 'delete', 'format', 'remove-marker'])(
    'rejects a protected content operation: %s',
    (operation) => {
      createEditor()
      const { node, pos } = findNode('fixed')
      const before = editor.state.doc
      const textPos = pos + 2
      const tr = editor.state.tr
      switch (operation) {
        case 'insert':
          tr.insertText('Changed', textPos)
          break
        case 'replace':
          tr.insertText('Changed', textPos, textPos + 3)
          break
        case 'delete':
          tr.delete(pos, pos + node.nodeSize)
          break
        case 'format':
          tr.addMark(textPos, textPos + 3, editor.schema.marks.italic.create())
          break
        case 'remove-marker':
          tr.setNodeMarkup(pos, undefined, {
            ...node.attrs,
            reportReadonly: false,
          })
          break
      }
      editor.view.dispatch(tr)
      expect(editor.state.doc).toBe(before)
    },
  )

  it('allows inserting and removing adjacent siblings without unlocking the section', () => {
    createEditor()
    const fixed = findNode('fixed').node
    const paragraph = editor.schema.nodes.paragraph.create(
      null,
      editor.schema.text('New'),
    )
    editor.view.dispatch(
      editor.state.tr.insert(findNode('fixed').pos, paragraph),
    )
    const { pos, node } = findNode('fixed')
    editor.view.dispatch(editor.state.tr.insert(pos + node.nodeSize, paragraph))
    expect(findNode('fixed').node.eq(fixed)).toBe(true)
    const before = findNode('intro')
    editor.commands.deleteRange({
      from: before.pos,
      to: before.pos + before.node.nodeSize,
    })
    expect(editor.state.doc.textContent).not.toContain('Before')
    expect(findNode('fixed').node.eq(fixed)).toBe(true)
    const after = findNode('commentary')
    editor.commands.deleteRange({
      from: after.pos,
      to: after.pos + after.node.nodeSize,
    })
    expect(editor.state.doc.textContent).not.toContain('After')
    expect(findNode('fixed').node.eq(fixed)).toBe(true)
  })

  it('protects multiple sections including nested markers and an empty section', () => {
    createEditor(
      '<div id="fixed" data-readonly="true"><p data-readonly="false">Fixed</p><p data-readonly="true">Nested</p></div><p>Editable</p><p id="empty" data-readonly="true"></p>',
    )
    const before = editor.state.doc
    for (const id of ['fixed', 'empty']) {
      const { node, pos } = findNode(id)
      editor.commands.deleteRange({ from: pos, to: pos + node.nodeSize })
      expect(editor.state.doc).toBe(before)
    }
    const fixed = findNode('fixed')
    editor.view.dispatch(editor.state.tr.insertText('Changed', fixed.pos + 2))
    expect(editor.state.doc).toBe(before)
  })

  it.each(['delete', 'paste', 'format'])(
    'rejects a cross-section selection operation: %s',
    (operation) => {
      createEditor()
      const from = findNode('intro').pos + 2
      const to = findNode('commentary').pos + 2
      editor.commands.setTextSelection({ from, to })
      const before = editor.state.doc
      if (operation === 'delete') editor.commands.deleteSelection()
      if (operation === 'paste') editor.commands.insertContent('<p>Pasted</p>')
      if (operation === 'format') editor.commands.toggleBold()
      expect(editor.state.doc).toBe(before)
    },
  )

  it('rejects moving a protected block even when its content is unchanged', () => {
    createEditor()
    const before = editor.state.doc
    const { pos, node } = findNode('fixed')
    const tr = editor.state.tr.delete(pos, pos + node.nodeSize)
    tr.insert(1, node)
    editor.view.dispatch(tr)
    expect(editor.state.doc).toBe(before)
  })

  it('rejects formatting or wrapping an ancestor of a protected section', () => {
    createEditor()
    const before = editor.state.doc
    editor.commands.selectAll()
    editor.commands.wrapIn('blockquote')
    expect(editor.state.doc).toBe(before)
    editor.view.dispatch(
      editor.state.tr.setNodeMarkup(0, undefined, {
        ...editor.state.doc.firstChild!.attrs,
        class: 'changed',
      }),
    )
    expect(editor.state.doc).toBe(before)
  })

  it('keeps a rejected edit out of undo history', () => {
    createEditor()
    editor.commands.setTextSelection(findNode('commentary').pos + 1)
    editor.commands.insertContent('New ')
    editor.commands.setTextSelection(findNode('fixed').pos + 2)
    editor.commands.insertContent('Rejected')
    expect(editor.state.doc.textContent).not.toContain('Rejected')
    editor.commands.undo()
    expect(findNode('commentary').node.textContent).toBe('After')
    editor.commands.redo()
    expect(findNode('commentary').node.textContent).toBe('New After')
  })

  it('can undo and redo a pasted protected copy without removing the original', () => {
    createEditor()
    const original = editor.state.doc
    const fixed = findNode('fixed').node
    editor.view.dispatch(
      editor.state.tr.insert(findNode('commentary').pos, fixed),
    )
    const pasted = editor.state.doc
    expect(pasted.eq(original)).toBe(false)
    expect(editor.commands.undo()).toBe(true)
    expect(editor.state.doc.eq(original)).toBe(true)
    expect(editor.commands.redo()).toBe(true)
    expect(editor.state.doc.eq(pasted)).toBe(true)
    const restored = editor.state.doc
    editor.commands.selectAll()
    editor.commands.deleteSelection()
    expect(editor.state.doc).toBe(restored)
  })

  it('allows ordinary formatting and replacing content that does not contain a protected section', () => {
    createEditor()
    const { pos, node } = findNode('commentary')
    editor.commands.setTextSelection({
      from: pos + 1,
      to: pos + node.nodeSize - 1,
    })
    editor.commands.toggleItalic()
    expect(findNode('commentary').node.firstChild?.marks[0].type.name).toBe(
      'italic',
    )
    editor.commands.insertContent('Replacement')
    expect(findNode('commentary').node.textContent).toBe('Replacement')
  })

  it('does not allow replacing the entire document to bypass protection', () => {
    createEditor()
    const before = editor.state.doc
    editor.commands.setContent('<p>Replacement</p>')
    expect(editor.state.doc).toBe(before)
  })

  it('finds protected descendants and permits selection without changing the document', () => {
    createEditor()
    const fixed = findNode('fixed')
    expect(isReadonlyReportPosition(editor.state.doc, fixed.pos)).toBe(true)
    expect(isReadonlyReportPosition(editor.state.doc, fixed.pos + 2)).toBe(true)
    expect(
      isReadonlyReportPosition(
        editor.state.doc,
        findNode('commentary').pos + 1,
      ),
    ).toBe(false)
    const tr = editor.state.tr.setSelection(
      TextSelection.create(editor.state.doc, fixed.pos + 2),
    )
    editor.view.dispatch(tr)
    expect(editor.state.selection.from).toBe(fixed.pos + 2)
  })
})
