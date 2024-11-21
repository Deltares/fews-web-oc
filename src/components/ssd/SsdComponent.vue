<template>
  <div
    class="ssd-container"
    ref="ssdContainer"
    id="ssd-container"
    v-resize="resize"
    :style="isHidden ? {} : { width: containerWidth + 'px' }"
  >
    <div
      class="tile-grid-content"
      :class="{ hidden: isHidden }"
      :style="{
        width: width + 'px',
        height: height + 'px',
        'margin-left': margin.left + 'px',
        'margin-top': margin.top + 'px',
        'margin-bottom': margin.top + 'px',
      }"
      ref="scroll-content"
    >
      <schematic-status-display
        v-if="src"
        class="weboc-ssd"
        :src="src"
        ref="svgContainer"
        @load="onLoad"
        @action="onAction"
        style="width: 100%"
        :transformRequestFn="createTransformRequestFn()"
      >
      </schematic-status-display>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount } from 'vue'
import { ref, onMounted, watch } from 'vue'
import { useDisplay } from 'vuetify'
import { createTransformRequestFn } from '@/lib/requests/transformRequest'

interface Props {
  src?: string
  fitWidth?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  src: '',
  fitWidth: true,
})

const ssdContainer = ref<HTMLElement>()
const svgContainer = ref<HTMLElement>()

const emit = defineEmits(['action', 'submit'])
defineExpose({ resize })

const { mobile } = useDisplay()

const width = ref(100)
const height = ref(100)
const margin = ref({ top: 0, left: 0 })
const isHidden = ref(true)
const containerWidth = ref(0)

let pos = { top: 0, left: 0, x: 0, y: 0 }
let aspectRatio = 1
let fitWidthValue = true

onMounted(() => {
  resize()
  if (ssdContainer.value) {
    ssdContainer.value.addEventListener('pointerdown', mouseDownHandler)
    ssdContainer.value.addEventListener('wheel', mouseWheelHandler, {
      passive: true,
    })
  }

  fitWidthHeightHandler()
})

onBeforeUnmount(() => {
  if (ssdContainer.value) {
    ssdContainer.value.removeEventListener('pointerdown', mouseDownHandler)
    ssdContainer.value.removeEventListener('wheel', mouseWheelHandler)
  }
})

watch(mobile, fitWidthHeightHandler)
watch(() => props.fitWidth, fitWidthHeightHandler)
function fitWidthHeightHandler(): void {
  fitWidthValue = !mobile.value && props.fitWidth
  setDimensions()
  pos = { top: 0, left: 0, x: 0, y: 0 }
  if (ssdContainer.value) {
    if (fitWidthValue) {
      ssdContainer.value.removeEventListener('pointerdown', mouseDownHandler)
      ssdContainer.value.removeEventListener('wheel', mouseWheelHandler)
    } else {
      ssdContainer.value.addEventListener('pointerdown', mouseDownHandler)
      ssdContainer.value.addEventListener('wheel', mouseWheelHandler, {
        passive: true,
      })
    }
  }
}

function mouseWheelHandler(event: WheelEvent): void {
  if (ssdContainer.value) {
    ssdContainer.value.scrollLeft += event.deltaY
    pos.left = ssdContainer.value.scrollLeft
  }
}

function mouseMoveHandler(event: PointerEvent): void {
  // How far the mouse has been moved
  const dx = event.clientX - pos.x
  const dy = event.clientY - pos.y

  // Scroll the element
  if (ssdContainer.value) {
    // ssdContainer.value.scrollLeft += event.deltaY
    pos.left = ssdContainer.value.scrollLeft
    ssdContainer.value.scrollTop = pos.top - dy
    ssdContainer.value.scrollLeft = pos.left - dx
    ssdContainer.value.style.cursor = 'grabbing'
  }
}

function mouseDownHandler(event: PointerEvent): void {
  if (ssdContainer.value) {
    const { scrollLeft, scrollTop } = ssdContainer.value

    pos = {
      // The current scroll
      left: scrollLeft,
      top: scrollTop,
      // Get the current mouse position
      x: event.clientX,
      y: event.clientY,
    }

    document.addEventListener('pointermove', mouseMoveHandler)
    document.addEventListener('pointerup', mouseUpHandler)
  }
}

function mouseUpHandler(): void {
  document.removeEventListener('pointermove', mouseMoveHandler)
  document.removeEventListener('pointerup', mouseUpHandler)
  if (ssdContainer.value) {
    const { scrollLeft, scrollTop } = ssdContainer.value

    pos.left = scrollLeft
    pos.top = scrollTop
    ssdContainer.value.style.cursor = 'inherit'
    ssdContainer.value.style.removeProperty('user-select')
  }
}

function restoreScrollPosition(): void {
  if (ssdContainer.value) {
    ssdContainer.value.scrollTop = pos.top
    ssdContainer.value.scrollLeft = pos.left
  }
}

function onLoad(): void {
  resize()
}

function onAction(event: CustomEvent): void {
  emit('action', event)
}

function resize(): void {
  if (ssdContainer.value === undefined) return
  isHidden.value = true
  nextTick(() => {
    margin.value = { top: 0, left: 0 }
    setAspectRatio()
    setDimensions()
    isHidden.value = false
    restoreScrollPosition()
  })
}

function setAspectRatio(): void {
  const sizes = getSvgContainerSizes()
  if (sizes.length) {
    // check if sizes is empty
    aspectRatio = +sizes[2] / +sizes[3]
    return
  }
  aspectRatio = 1
}

function getSvgContainerSizes(): number[] {
  if (svgContainer.value && svgContainer.value.firstChild) {
    const svg = svgContainer.value.firstChild as SVGElement
    const viewBox = svg.getAttribute('viewBox')
    if (viewBox) {
      const sizes = viewBox.split(' ', 4).map((x) => +x) as [
        number,
        number,
        number,
        number,
      ]
      return sizes
    }
  }
  return []
}

function setDimensions(): void {
  if (ssdContainer.value && aspectRatio) {
    let h = ssdContainer.value.clientHeight
    let w = ssdContainer.value.offsetWidth
    containerWidth.value = ssdContainer.value.offsetWidth
    let m = { top: 0, left: 0 }
    const dx = w - h * aspectRatio
    if (dx < 0 && !fitWidthValue) {
      // add space for scrollbar
      w = h * aspectRatio
    } else if (dx < 0) {
      const h1 = w / aspectRatio
      m = { top: (h - h1) / 2, left: 0 }
    } else {
      w = h * aspectRatio
      m = { top: 0, left: dx / 2 }
    }
    margin.value = m
    width.value = w
    height.value = h
  }
}
</script>

<style>
.ssd-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow-x: scroll;
  overflow-y: hidden;
  white-space: nowrap;
}

.tile-grid-content.hidden {
  display: none;
}

.v-theme--light .weboc-ssd > svg {
  background-color: #fff;
}

.v-theme--dark .weboc-ssd > svg {
  background-color: #fff;
}

.fit-content-button {
  position: absolute;
  padding: auto;
}

.scroll-content {
  position: relative;
}
</style>
