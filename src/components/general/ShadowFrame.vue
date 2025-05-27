<template>
  <div ref="shadowHost" class="shadow-frame" />
</template>

<script setup lang="ts">
import { watch, onMounted, useTemplateRef } from 'vue'

interface Props {
  htmlContent: string
}

const props = defineProps<Props>()

const shadowHost = useTemplateRef<HTMLDivElement>('shadowHost')
let shadowRoot: ShadowRoot | null = null

onMounted(() => {
  // Template ref's are only null before mounted and with v-if's
  // but ts does not know that shadowHost is not null
  if (shadowHost.value) {
    shadowRoot = shadowHost.value.attachShadow({ mode: 'open' })
    shadowRoot.innerHTML = props.htmlContent
  }
})

watch(
  () => props.htmlContent,
  (newContent) => {
    if (shadowRoot) {
      shadowRoot.innerHTML = newContent
    }
  },
)
</script>

<style scoped>
.shadow-frame {
  all: initial;
  height: 100%;
  width: 100%;
  overflow-y: auto;
}
</style>
