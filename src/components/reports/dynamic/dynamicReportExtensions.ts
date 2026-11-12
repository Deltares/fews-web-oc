import { extensions } from '@/components/reports/tiptap/extensions'
import CustomImage from '@/components/reports/tiptap/CustomImage'
import { DynamicReportInput } from './dynamicReportInput'

export const dynamicReportExtensions = [
  ...extensions.filter((extension) => extension.name !== 'image'),
  CustomImage.configure({ inline: true, allowBase64: true }),
  DynamicReportInput,
]
