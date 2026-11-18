import { Extension } from '@tiptap/core'
import { isHistoryTransaction } from '@tiptap/pm/history'
import type { Node } from '@tiptap/pm/model'
import { Plugin } from '@tiptap/pm/state'

export function isReadonlyReportPosition(doc: Node, pos: number): boolean {
  const resolved = doc.resolve(pos)
  if (doc.nodeAt(pos)?.attrs.reportReadonly === true) return true
  for (let depth = resolved.depth; depth > 0; depth--) {
    if (resolved.node(depth).attrs.reportReadonly === true) return true
  }
  return false
}

export const ReportReadonly = Extension.create({
  name: 'reportReadonly',

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
          reportReadonly: {
            default: false,
            keepOnSplit: false,
            parseHTML: (element: HTMLElement) =>
              element.getAttribute('data-readonly') === 'true',
            renderHTML: (attributes) =>
              attributes.reportReadonly
                ? { 'data-readonly': 'true', contenteditable: 'false' }
                : {},
          },
        },
      },
    ]
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        filterTransaction(transaction, state) {
          // History only replays accepted edits, including pasted protected copies.
          if (!transaction.docChanged || isHistoryTransaction(transaction)) {
            return true
          }
          let allowed = true
          state.doc.descendants((node, pos) => {
            if (!allowed || node.attrs.reportReadonly !== true) return allowed
            const start = transaction.mapping.mapResult(pos, 1)
            const end = transaction.mapping.mapResult(pos + node.nodeSize, -1)
            const mappedNode = transaction.doc.nodeAt(start.pos)
            if (
              start.deleted ||
              end.deleted ||
              end.pos - start.pos !== node.nodeSize ||
              !mappedNode ||
              !node.eq(mappedNode)
            ) {
              allowed = false
              return false
            }

            // Ancestor formatting or wrapping must not change a protected section.
            const before = state.doc.resolve(pos)
            const after = transaction.doc.resolve(start.pos)
            allowed = before.depth === after.depth
            for (let depth = 0; allowed && depth <= before.depth; depth++) {
              allowed = before.node(depth).sameMarkup(after.node(depth))
            }
            return false
          })
          return allowed
        },
      }),
    ]
  },
})
