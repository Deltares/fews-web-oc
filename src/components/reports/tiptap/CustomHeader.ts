import { mergeAttributes, Node } from '@tiptap/core'

export interface HeaderOptions {
  HTMLAttributes: Record<string, any>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    header: {
      /**
       * Toggle a header
       */
      setHeader: () => ReturnType
    }
  }
}

export const CustomHeader = Node.create<HeaderOptions>({
  name: 'header',

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  group: 'block',

  content: 'block*',

  parseHTML() {
    return [{ tag: 'header' }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'header',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        contenteditable: 'false',
        // disable text selection and dragging, it works in Chrome and Edge, but not in completely Firefox
        style:
          'user-select: none; -webkit-user-select: none; -webkit-user-drag: none; -webkit-app-region: no-drag; -moz-user-select: none; pointer-events: none;',
      }),
      0,
    ]
  },

  addCommands() {
    return {
      setParagraph:
        () =>
        ({ commands }) => {
          return commands.setNode(this.name)
        },
    }
  },
})

export default CustomHeader
