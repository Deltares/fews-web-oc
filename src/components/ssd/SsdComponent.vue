<template>
  <div
    ref="ssdContainer"
    id="ssd-container"
    v-resize="resize"
    :class="{ hidden: isHidden }"
    class="ssd-container w-100 h-100"
  >
    <schematic-status-display
      v-if="src"
      class="ssd w-100 h-100"
      :src="src"
      ref="svgContainer"
      @load="onLoad"
      @action="onAction"
      :transformRequestFn="createTransformRequestFn()"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, useTemplateRef } from 'vue'
import { ref, watch } from 'vue'
import { useDisplay } from 'vuetify'
import { createTransformRequestFn } from '@/lib/requests/transformRequest'
import {
  addD3ZoomToSvg,
  getAspectRatio,
  getDimensions,
  isSVGElement,
} from '@/lib/svg'

interface Props {
  src?: string
  fitWidth?: boolean
  allowZooming?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  fitWidth: true,
})

const ssdContainer = useTemplateRef('ssdContainer')
const svgContainer =
  useTemplateRef<HTMLSchematicStatusDisplayElement>('svgContainer')

const emit = defineEmits(['action'])
defineExpose({ resize })

const { mobile } = useDisplay()

const width = ref(100)
const height = ref(100)
const margin = ref({ top: 0, left: 0 })
const isHidden = ref(true)
const aspectRatio = ref(1)

const shouldFitWidth = computed(() => !mobile.value && props.fitWidth)
watch(shouldFitWidth, setDimensions)

function onLoad(): void {
  resize()
  setupD3Zoom()
}

function onAction(event: CustomEvent): void {
  emit('action', event)
}

async function resize() {
  isHidden.value = true

  await nextTick()

  setAspectRatio()
  setDimensions()

  isHidden.value = false
}

function setupD3Zoom() {
  const svg = getSvgElement()
  if (!svg) return

  addD3ZoomToSvg(svg)
}

function setAspectRatio() {
  const svg = getSvgElement()
  if (!svg) return

  aspectRatio.value = getAspectRatio(svg)
}

function setDimensions() {
  if (!ssdContainer.value) return

  const dimensions = getDimensions(
    ssdContainer.value,
    aspectRatio.value,
    shouldFitWidth.value,
  )
  height.value = dimensions.height
  width.value = dimensions.width
  margin.value = dimensions.margins
}

function getSvgElement() {
  const svg = svgContainer.value?.firstChild
  if (svg && isSVGElement(svg)) {
    return svg
  }
}
</script>

<style scoped>
.ssd-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow-x: scroll;
  overflow-y: hidden;
  white-space: nowrap;
  background-color: white;
}

.hidden {
  display: none;
}

.weboc-ssd > svg {
  background-color: #fff;
}

:deep(.ssd > svg) {
  pointer-events: auto !important;
}
</style>
