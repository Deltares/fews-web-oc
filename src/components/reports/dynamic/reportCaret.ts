import { Extension } from '@tiptap/core'
import type { Node } from '@tiptap/pm/model'

export function findReportCaretPosition(doc: Node): number | undefined {
  let firstEditable: number | undefined
  let marked: number | undefined
  let bestPriority = Infinity

  function visit(node: Node, pos: number, inheritedPriority = Infinity) {
    if (node.attrs.reportReadonly === true) return
    const value: unknown = node.attrs.reportCaret
    const priority = Math.min(
      inheritedPriority,
      node.isBlock && typeof value === 'number' && value >= 0
        ? value
        : Infinity,
    )
    if (node.isTextblock) {
      firstEditable ??= pos + 1
      if (priority < bestPriority) {
        marked = pos + 1
        bestPriority = priority
      }
      return
    }
    node.forEach((child, offset) => visit(child, pos + 1 + offset, priority))
  }

  visit(doc, -1)
  return marked ?? firstEditable
}

export const ReportCaret = Extension.create({
  name: 'reportCaret',

  addGlobalAttributes() {
    return [
      {
        types: this.extensions
          .filter(
            (extension) =>
              extension.type === 'node' &&
              extension.name !== 'doc' &&
              extension.name !== 'text',
          )
          .map((extension) => extension.name),
        attributes: {
          reportCaret: {
            default: null,
            keepOnSplit: false,
            parseHTML: (element: HTMLElement) => {
              const value = element.dataset.editorCaret?.trim()
              if (!value || !/^[+-]?\d+$/.test(value)) return null
              const priority = Number(value)
              return Number.isSafeInteger(priority) ? priority : null
            },
            renderHTML: (attributes) =>
              attributes.reportCaret !== null
                ? { 'data-editor-caret': String(attributes.reportCaret) }
                : {},
          },
        },
      },
    ]
  },
})
