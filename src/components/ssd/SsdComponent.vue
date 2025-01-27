<template>
  <div class="ssd-container h-100" ref="ssdContainer">
    <div :style="ssdSpacerStyle">
      <schematic-status-display
        v-if="src"
        class="ssd w-100"
        :class="{ 'h-100': props.allowZooming }"
        :src="src"
        ref="svgContainer"
        @load="onLoad"
        @action="onAction"
        :transformRequestFn="createTransformRequestFn()"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onUnmounted, useTemplateRef } from 'vue'
import { ref, watch } from 'vue'
import { useDisplay } from 'vuetify'
import { createTransformRequestFn } from '@/lib/requests/transformRequest'
import {
  addD3ZoomToSvg,
  getAspectRatio,
  getDimensions,
  isSVGElement,
} from '@/lib/svg'
import { useHorizontalScroll } from '@/services/useHorizontalScroll'

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
const aspectRatio = ref(1)

const ssdSpacerStyle = computed(() => {
  return props.allowZooming
    ? {
        width: '100%',
        height: '100%',
      }
    : {
        width: width.value + 'px',
        height: height.value + 'px',
        'margin-left': margin.value.left + 'px',
        'margin-top': margin.value.top + 'px',
        'margin-bottom': margin.value.top + 'px',
      }
})

const shouldFitWidth = computed(() => !mobile.value && props.fitWidth)
watch(shouldFitWidth, setDimensions)

function onLoad(): void {
  resize()

  if (props.allowZooming) {
    setupD3Zoom()
  } else {
    setupHorizontalScroll()
  }
}

function onAction(event: CustomEvent): void {
  emit('action', event)
}

async function resize() {
  await nextTick()

  setAspectRatio()
  setDimensions()
}

function setupD3Zoom() {
  const svg = getSvgElement()
  if (!svg) return

  addD3ZoomToSvg(svg)
}

function setupHorizontalScroll() {
  const container = ssdContainer.value
  if (!container) return

  const { mouseDownHandler, mouseWheelHandler } = useHorizontalScroll()

  container.addEventListener('wheel', mouseWheelHandler, { passive: true })
  container.addEventListener('mousedown', mouseDownHandler, { passive: true })

  onUnmounted(() => {
    container.removeEventListener('wheel', mouseWheelHandler)
    container.removeEventListener('mousedown', mouseDownHandler)
  })
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
