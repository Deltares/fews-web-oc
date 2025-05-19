import { Extension } from '@tiptap/core'

export const CustomKeybindings = Extension.create({
  addKeyboardShortcuts() {
    return {
      Enter: () => {
        this.editor
          .chain()
          .selectParentNode()
          .createParagraphNear()
          .focus()
          .run()
        return true
      },
    }
  },
})

export default CustomKeybindings
