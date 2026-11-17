// @vitest-environment jsdom
import { Editor } from '@tiptap/core'
import { afterEach, describe, expect, it } from 'vitest'
import { extensions } from '@/components/reports/tiptap/extensions'

let editor: Editor | undefined

afterEach(() => {
  editor?.destroy()
  editor = undefined
})

describe('report Enter bindings', () => {
  it('splits a paragraph at the cursor and supports undo', () => {
    editor = new Editor({
      extensions,
      content: '<p>Hello world</p>',
    })
    editor.commands.setTextSelection(6)
    expect(editor.commands.keyboardShortcut('Enter')).toBe(true)
    expect(editor.getJSON().content).toMatchObject([
      { type: 'paragraph', content: [{ type: 'text', text: 'Hello' }] },
      { type: 'paragraph', content: [{ type: 'text', text: ' world' }] },
    ])
    expect(editor.commands.undo()).toBe(true)
    expect(editor.getJSON().content).toMatchObject([
      { type: 'paragraph', content: [{ type: 'text', text: 'Hello world' }] },
    ])
  })

  it('continues a list item when Enter is pressed in the middle', () => {
    editor = new Editor({
      extensions,
      content: '<ul><li><p>Hello world</p></li></ul>',
    })
    editor.commands.setTextSelection(8)
    expect(editor.commands.keyboardShortcut('Enter')).toBe(true)
    expect(editor.getJSON().content).toMatchObject([
      {
        type: 'bulletList',
        content: [
          {
            type: 'listItem',
            content: [{ content: [{ text: 'Hello' }] }],
          },
          {
            type: 'listItem',
            content: [{ content: [{ text: ' world' }] }],
          },
        ],
      },
    ])
  })
})
