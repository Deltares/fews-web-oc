import { extensions } from '@/components/reports/tiptap/extensions'
import CustomImage from '@/components/reports/tiptap/CustomImage'
import { DynamicReportInput } from './dynamicReportInput'
import { Extension, Mark, Node } from '@tiptap/core'

const ReportSpan = Mark.create({
  name: 'reportSpan',
  parseHTML() {
    return [{ tag: 'span[class], span[id], span[style], span[data-status]' }]
  },
  renderHTML({ HTMLAttributes }) {
    return ['span', HTMLAttributes, 0]
  },
})

const ReportHeader = Node.create({
  name: 'reportHeader',
  group: 'block',
  content: 'block*',
  parseHTML() {
    return [{ tag: 'header' }]
  },
  renderHTML({ HTMLAttributes }) {
    return ['header', HTMLAttributes, 0]
  },
})

const ReportAttributes = Extension.create({
  name: 'reportAttributes',
  addGlobalAttributes() {
    return [
      {
        types: ['reportSpan', 'reportHeader', 'article', 'small'],
        attributes: {
          class: { default: null },
          style: { default: null },
          id: { default: null },
          dataSet: {
            default: null,
            parseHTML: (element: HTMLElement) => ({ ...element.dataset }),
            renderHTML: (attributes) =>
              Object.fromEntries(
                Object.entries(attributes.dataSet ?? {}).map(([key, value]) => [
                  `data-${key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`,
                  value,
                ]),
              ),
          },
        },
      },
      {
        types: ['tableHeader'],
        attributes: {
          scope: {
            default: null,
            parseHTML: (element: HTMLElement) => element.getAttribute('scope'),
          },
        },
      },
    ]
  },
})

export const dynamicReportExtensions = [
  ...extensions.filter(
    (extension) => extension.name !== 'image' && extension.name !== 'header',
  ),
  CustomImage.configure({ inline: true, allowBase64: true }),
  DynamicReportInput,
  ReportSpan,
  ReportHeader,
  ReportAttributes,
]
