import { Mark, mergeAttributes } from '@tiptap/core'

export interface DataOptions {
  /**
   * A list of HTML attributes to be rendered.
   */
  HTMLAttributes: Record<string, any>
}

const Data = Mark.create<DataOptions>({
  name: 'data',
  priority: 1000,
  keepOnSplit: false,

  addAttributes() {
    return {
      value: {
        parseHTML: (element) => element.getAttribute('value'),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'data' }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'data',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
      0,
    ]
  },
})

export default Data
