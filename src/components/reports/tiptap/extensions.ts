import Blockquote from '@tiptap/extension-blockquote'
import Bold from '@tiptap/extension-bold'
import BulletList from '@tiptap/extension-bullet-list'
import Code from '@tiptap/extension-code'
import CodeBlock from '@tiptap/extension-code-block'
import Color from '@tiptap/extension-color'
import Document from '@tiptap/extension-document'
import Dropcursor from '@tiptap/extension-dropcursor'
import Gapcursor from '@tiptap/extension-gapcursor'
import HardBreak from '@tiptap/extension-hard-break'
import CustomHeader from './CustomHeader.js'
import Heading from '@tiptap/extension-heading'
import Highlight from '@tiptap/extension-highlight'
import History from '@tiptap/extension-history'
import HorizontalRule from '@tiptap/extension-horizontal-rule'
import Image from './CustomImage.js'
import Italic from '@tiptap/extension-italic'
import Link from '@tiptap/extension-link'
import ListItem from '@tiptap/extension-list-item'
import OrderedList from '@tiptap/extension-ordered-list'
import Paragraph from '@tiptap/extension-paragraph'
import Subscript from '@tiptap/extension-subscript'
import Superscript from '@tiptap/extension-superscript'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import Text from '@tiptap/extension-text'
import TextAlign from '@tiptap/extension-text-align'
import TextStyle from '@tiptap/extension-text-style'
import Typography from '@tiptap/extension-typography'
import Underline from '@tiptap/extension-underline'
import Data from './Data.js'
import Time from './Time.js'

// import Keybindings from './CustomKeybindings'
import Division from './CustomDivision.js'
import { KeepHtmlAttributes } from './KeepHtmlAtrributes.js'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import { Node } from '@tiptap/core'

export const extensions = [
  Blockquote,
  Bold,
  BulletList,
  Code,
  CodeBlock,
  Color.configure({
    types: ['textStyle'],
  }),
  Document,
  Dropcursor,
  Gapcursor,
  HardBreak,
  Heading,
  HorizontalRule,
  // FIXME: Remove when using the Collabaration extension
  History,
  Highlight,
  Italic,
  Link.configure({
    protocols: ['mailto', 'tel', 'fax'],
  }),
  ListItem,
  OrderedList,
  Paragraph,
  Subscript,
  Superscript,
  Table,
  TableCell,
  TableHeader,
  TableRow,
  Text,
  TextAlign.configure({
    types: ['heading', 'paragraph', 'tableCell', 'tableHeader'],
    defaultAlignment: '',
  }),
  TextStyle,
  Typography.configure({
    oneHalf: false,
    oneQuarter: false,
    threeQuarters: false,
  }),
  Underline,
  // Custom extensions
  Division,
  CustomHeader,
  Image.configure({ inline: true }),
  Data,
  Time,
  KeepHtmlAttributes,
  Node.create({
    name: 'article',
    group: 'block',
    content: 'block+',
    parseHTML() {
      return [{ tag: 'article' }]
    },
    renderHTML({ HTMLAttributes }) {
      return ['article', HTMLAttributes, 0]
    },
  }),
  Node.create({
    name: 'small',
    group: 'block',
    content: 'block+',
    parseHTML() {
      return [{ tag: 'small' }]
    },
    renderHTML({ HTMLAttributes }) {
      return ['small', HTMLAttributes, 0]
    },
  }),
  // FIXME: Keybindings are not inserting a Enter half way through a paragraph
  // Keybindings,
]
