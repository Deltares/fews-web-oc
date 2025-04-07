<template>
  <div ref="shadowHost" class="shadow-frame" />
</template>

<script setup lang="ts">
import { watch, onMounted, defineProps, useTemplateRef } from 'vue'

interface Props {
  htmlContent: string
}

const props = defineProps<Props>()

const shadowHost = useTemplateRef<HTMLDivElement>('shadowHost')
let shadowRoot: ShadowRoot | null = null

onMounted(() => {
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
