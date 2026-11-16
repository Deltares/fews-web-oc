import { Node, mergeAttributes } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import DynamicReportInputNode from './DynamicReportInputNode.vue'

export const DynamicReportInput = Node.create({
  name: 'dynamicReportInput',
  group: 'inline',
  inline: true,
  atom: true,

  addAttributes() {
    return {
      inputType: {
        default: '',
        parseHTML: (element: HTMLElement) => element.dataset.inputType,
        renderHTML: (attributes) => ({
          'data-input-type': attributes.inputType,
        }),
      },
      timeSeriesIndex: {
        default: '',
        parseHTML: (element: HTMLElement) => element.dataset.timeSeriesIndex,
        renderHTML: (attributes) => ({
          'data-time-series-index': attributes.timeSeriesIndex,
        }),
      },
      time: {
        default: '',
        parseHTML: (element: HTMLElement) => element.dataset.time,
        renderHTML: (attributes) => ({ 'data-time': attributes.time }),
      },
      value: {
        default: '',
        parseHTML: (element: HTMLElement) => element.textContent?.trim() ?? '',
        rendered: false,
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-input-type][data-time-series-index][data-time]',
        getAttrs: (element) => {
          if (typeof element === 'string') return false
          const { inputType, timeSeriesIndex, time } = element.dataset
          return inputType && timeSeriesIndex && time ? null : false
        },
        priority: 100,
      },
    ]
  },

  renderHTML({ node, HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes), String(node.attrs.value)]
  },

  addNodeView() {
    return VueNodeViewRenderer(DynamicReportInputNode)
  },
})
