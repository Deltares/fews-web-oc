<template>
  <div ref="shadowHost" class="shadow-frame" />
</template>

<script setup lang="ts">
import { useDark } from '@vueuse/core'
import { watch, onMounted, useTemplateRef } from 'vue'

interface Props {
  htmlContent: string
}

const props = defineProps<Props>()

const shadowHost = useTemplateRef<HTMLDivElement>('shadowHost')
let shadowRoot: ShadowRoot | null = null
const isDark = useDark()
let html!: HTMLDivElement

onMounted(() => {
  // Template ref's are only null before mounted and with v-if's
  // but ts does not know that shadowHost is not null
  if (shadowHost.value) {
    shadowRoot = shadowHost.value.attachShadow({ mode: 'open' })
    html = document.createElement('div')
    if (isDark.value) {
      html.classList.add('dark')
    }
    html.innerHTML = props.htmlContent
    shadowRoot.appendChild(html)
  }
})

watch(
  () => isDark.value,
  (dark) => {
    if (dark) {
      html.classList.add('dark')
    } else {
      html.classList.remove('dark')
    }
  },
)

watch(
  () => props.htmlContent,
  (newContent) => {
    if (html) {
      html.innerHTML = newContent
    }
  },
)
</script>

<style scoped>
.shadow-frame {
  all: initial;
  height: 100%;
  padding: 10px;
  overflow-y: auto;
}
</style>
