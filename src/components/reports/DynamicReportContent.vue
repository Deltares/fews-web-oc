<template>
  <div class="dynamic-report-root overflow-y-auto pa-2">
    <!-- Content is managed outside of Vue, Vue nodes are teleported into it -->
    <div ref="host" />
    <Teleport v-if="editor && editorTarget" :to="editorTarget">
      <EditorContent :editor="editor" />
    </Teleport>
    <Teleport v-for="node in nodes" :key="node.key" :to="node.element">
      <slot name="node" :node="node" />
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import {
  nextTick,
  onBeforeUnmount,
  shallowRef,
  useTemplateRef,
  watch,
} from 'vue'
import {
  type DynamicReportStyling,
  DYNAMIC_REPORT_SCOPE,
  sanitizeDynamicReport,
  scopeCss,
} from '@/lib/dynamic-report/sanitize'
import { createDynamicReportStyleSheets } from '@/lib/dynamic-report/styles'
import {
  type DynamicReportNode,
  findDynamicReportNodes,
} from '@/lib/dynamic-report/nodes'
import { useDark } from '@/services/useDark'
import { Editor, EditorContent } from '@tiptap/vue-3'
import { dynamicReportExtensions } from './dynamic/dynamicReportExtensions'
import { InlineReportImageStorage } from '@/lib/dynamic-report/imageStorage'
import { checkScreenshotLimits } from '@/lib/dynamic-report/screenshotLimits'

interface Props {
  html: string
  /** Original report HTML supplying styles when the body has been edited. */
  styleHtml?: string
  /** CSS for the Vue nodes, scoped styles do not reach an isolated report */
  nodeCss?: string
  editable?: boolean
  initialEditorHtml?: string
}

const props = withDefaults(defineProps<Props>(), {
  nodeCss: '',
  editable: false,
})

const emit = defineEmits<{
  update: [html: string]
}>()

defineSlots<{
  node(props: { node: DynamicReportNode }): unknown
}>()

const host = useTemplateRef<HTMLDivElement>('host')
const nodes = shallowRef<DynamicReportNode[]>([])
const editor = shallowRef<Editor>()
const editorTarget = shallowRef<HTMLElement>()
const isDark = useDark()

const imageStorage = new InlineReportImageStorage()

async function insertScreenshot(image: Blob, alt: string, caption?: string) {
  const activeEditor = editor.value
  if (!activeEditor) throw new Error('The report editor is not ready')
  const reference = await imageStorage.save(image)
  const url = await imageStorage.resolve(reference)
  if (editor.value !== activeEditor || activeEditor.isDestroyed) {
    throw new Error(
      'The report changed while the screenshot was being prepared',
    )
  }
  const screenshots: string[] = []
  activeEditor.state.doc.descendants((node) => {
    if (node.type.name === 'image' && node.attrs.dataSet?.reportScreenshot) {
      screenshots.push(node.attrs.src)
    }
  })
  checkScreenshotLimits(screenshots, reference)
  const inserted = activeEditor
    .chain()
    .focus()
    .insertContent([
      {
        type: 'image',
        attrs: { src: url, alt, dataSet: { reportScreenshot: 'true' } },
      },
      ...(caption
        ? [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: caption }],
            },
          ]
        : []),
    ])
    .run()
  if (!inserted)
    throw new Error('Could not insert the screenshot in the report')
}

defineExpose({ editor, insertScreenshot })

// Constructable style sheets are not blocked by a strict style-src CSP
let styleSheets: CSSStyleSheet[] = []
let styleTarget: Document | ShadowRoot | undefined
// Element that mirrors the dark mode of the WebOC in an isolated report
let darkModeElement: HTMLElement | undefined

const isolatedSheet = new CSSStyleSheet()
// Do not inherit the WebOC styles, like the font and colour
isolatedSheet.replaceSync(':host { all: initial; display: block; }')

function setStyleSheets(
  target: Document | ShadowRoot | undefined,
  newStyleSheets: CSSStyleSheet[],
) {
  if (styleTarget) {
    styleTarget.adoptedStyleSheets = styleTarget.adoptedStyleSheets.filter(
      (sheet) => !styleSheets.includes(sheet),
    )
  }
  if (target) {
    target.adoptedStyleSheets = [
      ...target.adoptedStyleSheets,
      ...newStyleSheets,
    ]
  }
  styleTarget = target
  styleSheets = newStyleSheets
}

/**
 * Create the report container. With isolated styling the container is placed
 * in a shadow root, so only the report styles apply.
 */
function createContainer(element: HTMLElement, styling: DynamicReportStyling) {
  const container = document.createElement('div')
  container.className = DYNAMIC_REPORT_SCOPE.slice(1)

  if (styling === 'weboc') {
    element.replaceChildren(container)
    darkModeElement = undefined
    return { container, target: document }
  }

  const shadowHost = document.createElement('div')
  const shadowRoot = shadowHost.attachShadow({ mode: 'open' })
  // Report styles can use ".dark :scope" in both stylings
  darkModeElement = document.createElement('div')
  darkModeElement.classList.toggle('dark', isDark.value)
  darkModeElement.appendChild(container)
  shadowRoot.appendChild(darkModeElement)
  element.replaceChildren(shadowHost)
  return { container, target: shadowRoot }
}

watch(isDark, (dark) => darkModeElement?.classList.toggle('dark', dark))

let renderId = 0

onBeforeUnmount(() => {
  // Discard style sheets of a render that is still loading
  renderId++
  editor.value?.destroy()
  setStyleSheets(undefined, [])
})

watch(
  [
    () => props.html,
    () => props.styleHtml,
    () => props.nodeCss,
    () => props.editable,
    host,
  ],
  async ([html, styleHtml, nodeCss, editable, element]) => {
    if (!element) return
    const currentRenderId = ++renderId
    // Unmount the Vue nodes before their target elements are removed
    nodes.value = []
    const previousEditor = editor.value
    editor.value = undefined
    editorTarget.value = undefined
    await nextTick()
    previousEditor?.destroy()
    const report = sanitizeDynamicReport(html)
    const { styles, styling } = styleHtml
      ? sanitizeDynamicReport(styleHtml)
      : report
    const { fragment } = report
    // Load the style sheets before showing the report to prevent a flash of
    // unstyled content
    const reportStyleSheets = await createDynamicReportStyleSheets(styles)
    // A newer report arrived while waiting
    if (currentRenderId !== renderId) return

    // Scoped like the report styles, so the node CSS does not apply to the
    // rest of the WebOC when it is adopted by the document
    const nodeSheet = new CSSStyleSheet()
    nodeSheet.replaceSync(scopeCss(nodeCss))
    const { container, target } = createContainer(element, styling)
    setStyleSheets(target, [
      ...(styling === 'isolated' ? [isolatedSheet] : []),
      nodeSheet,
      ...reportStyleSheets,
    ])
    if (editable) {
      const content = document.createElement('div')
      content.appendChild(
        props.initialEditorHtml
          ? sanitizeDynamicReport(props.initialEditorHtml).fragment
          : fragment,
      )
      const nextEditor = new Editor({
        extensions: dynamicReportExtensions,
        content: content.innerHTML,
        onUpdate: ({ editor }) => emit('update', editor.getHTML()),
      })
      editorTarget.value = container
      editor.value = nextEditor
    } else {
      container.replaceChildren(fragment)
      nodes.value = findDynamicReportNodes(container)
    }
  },
  { immediate: true },
)
</script>

<style scoped>
.dynamic-report-root {
  /* Keep the report inside its box: fixed positioned report content is
     positioned and clipped relative to the root, so it cannot cover the
     rest of the WebOC */
  contain: layout paint;
}
</style>
