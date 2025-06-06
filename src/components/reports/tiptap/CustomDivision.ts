import { mergeAttributes, Node } from '@tiptap/core'

export interface DivisionOptions {
  HTMLAttributes: Record<string, any>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    division: {
      /**
       * Toggle a division
       */
      setDivision: () => ReturnType
    }
  }
}

export const Division = Node.create<DivisionOptions>({
  name: 'division',

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  group: 'block',

  content: 'block*',

  parseHTML() {
    return [{ tag: 'div' }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
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

export default Division
