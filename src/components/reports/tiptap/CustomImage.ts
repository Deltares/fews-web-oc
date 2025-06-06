import Image from '@tiptap/extension-image'

export const CustomImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),

      alt: {
        parseHTML: (element) => element.getAttribute('alt'),
      },

      src: {
        parseHTML: (element) => element.getAttribute('src'),
      },

      width: {
        parseHTML: (element) => element.getAttribute('width'),
      },

      height: {
        parseHTML: (element) => element.getAttribute('height'),
      },
    }
  },
})

export default CustomImage
