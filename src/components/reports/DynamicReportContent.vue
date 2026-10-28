<template>
  <div class="dynamic-report-root overflow-y-auto pa-2">
    <!-- Content is managed outside of Vue, Vue nodes are teleported into it -->
    <div ref="host" />
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

interface Props {
  html: string
  /** CSS for the Vue nodes, scoped styles do not reach an isolated report */
  nodeCss?: string
}

const props = withDefaults(defineProps<Props>(), {
  nodeCss: '',
})

defineSlots<{
  node(props: { node: DynamicReportNode }): unknown
}>()

const host = useTemplateRef<HTMLDivElement>('host')
const nodes = shallowRef<DynamicReportNode[]>([])
const isDark = useDark()

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
  setStyleSheets(undefined, [])
})

watch(
  [() => props.html, () => props.nodeCss, host],
  async ([html, nodeCss, element]) => {
    if (!element) return
    const currentRenderId = ++renderId
    // Unmount the Vue nodes before their target elements are removed
    nodes.value = []
    await nextTick()
    const { fragment, styles, styling } = sanitizeDynamicReport(html)
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
    container.replaceChildren(fragment)
    nodes.value = findDynamicReportNodes(container)
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
