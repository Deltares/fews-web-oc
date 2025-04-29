import { Mark, mergeAttributes } from '@tiptap/core'

export interface LinkProtocolOptions {
  scheme: string
  optionalSlashes?: boolean
}

export interface TimeOptions {
  /**
   * A list of HTML attributes to be rendered.
   */
  HTMLAttributes: Record<string, any>
}

const Time = Mark.create<TimeOptions>({
  name: 'time',
  priority: 1000,
  keepOnSplit: false,

  onUpdate() {
    // update the node's attributes with the value from the contenteditable element
    const state = this.editor!.state
    const editor = this.editor!
    const tr = state.tr
    const nodeText = tr.selection.$head.parent.textContent

    // do not throw the update event to prevent recursion
    if (nodeText !== this.storage.textContent) {
      this.storage.textContent = nodeText
      editor
        .chain()
        .extendMarkRange('time')
        .updateAttributes('time', { datetime: nodeText })
        .run()
    }
  },

  addStorage() {
    return {
      textContent: '',
    }
  },

  addAttributes() {
    return {
      datetime: {
        parseHTML: (element) => {
          const datetimeValue = element.getAttribute('datetime')
          if (datetimeValue !== null) {
            this.storage.textContent = datetimeValue
          }
          return datetimeValue
        },
      },
    }
  },

  parseHTML() {
    return [{ tag: 'time' }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'time',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
      0,
    ]
  },
})

export default Time
