<template>
  <div class="ssd-container" ref="ssd-container" id="ssd-container" v-resize="resize" :style="isHidden ? {} : { width: containerWidth + 'px'}">
    <div class="tile-grid-content" :class="{hidden: isHidden}"
      :style="{ width: width + 'px', height: height + 'px', 'margin-left': margin.left + 'px', 'margin-top': margin.top + 'px', 'margin-bottom': margin.top + 'px' }"
      ref="scroll-content">
      <schematic-status-display class="web-oc-ssd" :src="src" ref="ssd" @load="onLoad" @action="onAction" style="width: 100%;">
      </schematic-status-display>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Ref, Watch } from 'vue-property-decorator'

@Component
export default class SsdComponent extends Vue {
  @Prop({ default: '' })
    readonly src!: string
  @Prop({ default: true })
    readonly fitWidth!: boolean

  // @Ref properties are defined in beforeMount hook
  @Ref('ssd-container') container!: HTMLElement;
  @Ref('ssd') svgContainer!: HTMLElement;

  width = 100
  height = 100
  margin = { top: 0, left: 0 }
  isHidden = true
  pos = { top: 0, left: 0, x: 0, y: 0 }
  aspectRatio = 1
  containerWidth = 0
  fitWidthValue = true

  mounted (): void {
    this.resize()
    this.container.addEventListener('pointerdown', this.mouseDownHandler)
    this.container.addEventListener('wheel', this.mouseWheelHandler, { passive: true })
    this.fitWidthHeightHandler()
  }

  destroy (): void {
    this.container.removeEventListener('pointerdown', this.mouseDownHandler)
    this.container.removeEventListener('wheel', this.mouseWheelHandler)
  }


  @Watch('$vuetify.breakpoint.mobile')
  @Watch('fitWidth')
  fitWidthHeightHandler (): void {
    this.fitWidthValue = !this.$vuetify.breakpoint.mobile && this.fitWidth
    this.setDimensions()
    this.pos = { top: 0, left: 0, x: 0, y: 0 }
    if (this.fitWidthValue) {
      this.container.removeEventListener('pointerdown', this.mouseDownHandler)
      this.container.removeEventListener('wheel', this.mouseWheelHandler)
    } else {
      this.container.addEventListener('pointerdown', this.mouseDownHandler)
      this.container.addEventListener('wheel', this.mouseWheelHandler, { passive: true })
    }
  }

  mouseWheelHandler (event: WheelEvent): void {
    this.container.scrollLeft += event.deltaY
    this.pos.left = this.container.scrollLeft
  }

  mouseMoveHandler (event: PointerEvent): void {
    // How far the mouse has been moved
    const dx = event.clientX - this.pos.x
    const dy = event.clientY - this.pos.y

    // Scroll the element
    this.container.scrollTop = this.pos.top - dy
    this.container.scrollLeft = this.pos.left - dx

    this.container.style.cursor = 'grabbing'
  }

  mouseDownHandler (event: PointerEvent): void {
    this.pos = {
      // The current scroll
      left: this.container.scrollLeft,
      top: this.container.scrollTop,
      // Get the current mouse position
      x: event.clientX,
      y: event.clientY,
    }

    document.addEventListener('pointermove', this.mouseMoveHandler)
    document.addEventListener('pointerup', this.mouseUpHandler)
  }

  mouseUpHandler (): void {
    document.removeEventListener('pointermove', this.mouseMoveHandler)
    document.removeEventListener('pointerup', this.mouseUpHandler)
    this.pos.left = this.container.scrollLeft
    this.pos.top = this.container.scrollTop
    this.container.style.cursor = 'inherit'
    this.container.style.removeProperty('user-select')
  }

  restoreScrollPosition (): void {
    this.container.scrollTop = this.pos.top
    this.container.scrollLeft = this.pos.left
  }

  onLoad (): void {
    this.resize()
  }

  onAction(event: CustomEvent): void {
    this.$emit('action', event)
  }

  resize (): void {
    if (this.container === undefined) return
    this.isHidden = true
    this.$nextTick(() => {
      this.margin = { top: 0, left: 0 }
      this.setAspectRatio()
      this.setDimensions()
      this.isHidden = false
      this.restoreScrollPosition()
    })
  }

  setAspectRatio (): void {
    const sizes = this.getSvgContainerSizes()
    if (sizes) { // check if sizes is empty
      this.aspectRatio = +sizes[2] / +sizes[3]
      return
    }
    this.aspectRatio = 1
  }

  getSvgContainerSizes(): number[] {
    if (this.svgContainer && this.svgContainer.firstChild) {
      const svg = this.svgContainer.firstChild as SVGElement
      const viewBox = svg.getAttribute('viewBox')
      if (viewBox) {
        const sizes = viewBox.split(' ', 4).map(x => +x) as [number, number, number, number]
        return sizes
      }
    }
    return []
  }

  setDimensions (): void {
    let height = this.container.clientHeight
    let width = this.container.offsetWidth
    this.containerWidth = this.container.offsetWidth
    let margin = { top: 0, left: 0 }
    const dx = this.container.offsetWidth - height * this.aspectRatio
    if (dx < 0 && !this.fitWidthValue) {
      // add space for scrollbar
      width = height * this.aspectRatio
    } else if (dx < 0) {
      height = this.container.offsetWidth / this.aspectRatio
      margin = { top: (this.container.clientHeight - height) / 2, left: 0 }
    } else {
      width = height * this.aspectRatio
      margin = { top: 0, left: dx / 2 }
    }
    this.margin = margin
    this.width = width
    this.height = height
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

.theme--light .ssd-container {
  background-color: lightgray;
}

.tile-grid-content.hidden {
  display: none;
}

.theme--light .web-oc-ssd > svg {
  background-color: #fff;
}

.theme--dark .web-oc-ssd > svg {
  background-color: #606060;
}
.fit-content-button {
  position: absolute;
  padding: auto;
}
.scroll-content {
  position: relative;
}
</style>
