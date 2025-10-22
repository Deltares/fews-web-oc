import { BulletList, ListItem, OrderedList } from '@tiptap/extension-list'
import {
  Table,
  TableCell,
  TableHeader,
  TableRow,
} from '@tiptap/extension-table'
import { TextStyleKit } from '@tiptap/extension-text-style'
import { Dropcursor, Gapcursor, UndoRedo } from '@tiptap/extensions'
import Blockquote from '@tiptap/extension-blockquote'
import Bold from '@tiptap/extension-bold'
import Code from '@tiptap/extension-code'
import CodeBlock from '@tiptap/extension-code-block'
import Document from '@tiptap/extension-document'
import HardBreak from '@tiptap/extension-hard-break'
import CustomHeader from './CustomHeader.js'
import Heading from '@tiptap/extension-heading'
import Highlight from '@tiptap/extension-highlight'
import HorizontalRule from '@tiptap/extension-horizontal-rule'
import Image from './CustomImage.js'
import Italic from '@tiptap/extension-italic'
import Link from '@tiptap/extension-link'
import Paragraph from '@tiptap/extension-paragraph'
import Subscript from '@tiptap/extension-subscript'
import Superscript from '@tiptap/extension-superscript'
import Text from '@tiptap/extension-text'
import TextAlign from '@tiptap/extension-text-align'
import Typography from '@tiptap/extension-typography'
import Underline from '@tiptap/extension-underline'
import Data from './Data.js'
import Time from './Time.js'

// import Keybindings from './CustomKeybindings'
import Division from './CustomDivision.js'
import { KeepHtmlAttributes } from './KeepHtmlAtrributes.js'
import { Node } from '@tiptap/core'

export const extensions = [
  Blockquote,
  Bold,
  BulletList,
  Code,
  CodeBlock,
  Document,
  Dropcursor,
  Gapcursor,
  HardBreak,
  Heading,
  HorizontalRule,
  // FIXME: Remove when using the Collabaration extension
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
  TextStyleKit.configure({
    backgroundColor: {
      types: ['textStyle'],
    },
    color: {
      types: ['textStyle'],
    },
    fontFamily: {
      types: ['textStyle'],
    },
    fontSize: {
      types: ['textStyle'],
    },
    lineHeight: {
      types: ['textStyle'],
    },
  }),
  UndoRedo,
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
