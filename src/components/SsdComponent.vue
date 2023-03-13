<template>
  <div class="ssd-container" ref="ssd-container" id="ssd-container" v-resize="resize" :style="isHidden ? {} : { width: containerWidth + 'px'}">
    <div class="tile-grid-content" :class="{hidden: isHidden}"
      :style="{ width: width + 'px', height: height + 'px', 'margin-left': margin.left + 'px', 'margin-top': margin.top + 'px', 'margin-bottom': margin.top + 'px' }"
      ref="scroll-content">
      <v-btn v-if="isButtonShown"
      fab class="fit-content-button" @click="fitWidthHeightHandler" elevation="4" fixed right top v-bind="sizeButton">
      <v-icon> {{buttonIcon}} </v-icon>
      </v-btn>
      <schematic-status-display class="web-oc-ssd" :src="src" ref="ssd" @load="onLoad" @action="onAction" style="width: 100%;">
      </schematic-status-display>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Ref } from 'vue-property-decorator'

@Component
export default class SsdComponent extends Vue {
  @Prop({ default: '' })
    src!: string

  @Ref('ssd-container') container!: HTMLElement;
  @Ref('scroll-content') scrollContainer!: HTMLElement;
  @Ref('ssd') svgContainer!: HTMLElement;

  width = 100
  height = 100
  margin = { top: 0, left: 0 }
  isHidden = true
  pos = { top: 0, left: 0, x: 0, y: 0 }
  aspectRatio = 1
  fitWidth = false
  containerWidth = 0
  buttonIcon = "mdi-arrow-split-vertical"
  isButtonShown = false

  mounted (): void {
    this.container = this.$refs['ssd-container'] as HTMLElement
    this.resize()
    this.container.addEventListener('pointerdown', this.mouseDownHandler)
    this.container.addEventListener('wheel', this.mouseWheelHandler, { passive: true })
    this.container.addEventListener('dblclick', this.fitWidthHeightHandler)
  }

  destroy (): void {
    this.container.removeEventListener('pointerdown', this.mouseDownHandler)
    this.container.removeEventListener('wheel', this.mouseWheelHandler)
    this.container.removeEventListener('dblclick', this.fitWidthHeightHandler)
  }
  get sizeButton() {
      const size = {xs:'x-small',sm:'small', md:'', lg:'large',xl:'x-large'}[this.$vuetify.breakpoint.name]
      return size ? { [size]: true } : {}
    }

  showButton(): void {
    if (this.container && this.svgContainer) {
      const sizes = this.getSvgContainerSizes()
      if (sizes) {
        const condition =  this.containerWidth <= sizes[2]
        this.isButtonShown = condition
        return
      }      
    }
    this.isButtonShown = false 
  }

  fitWidthHeightHandler (): void {
    this.fitWidth = !this.fitWidth
    this.setDimensions()
    this.pos = { top: 0, left: 0, x: 0, y: 0 }
    if (!this.fitWidth) {
      this.buttonIcon = "mdi-arrow-split-vertical"
      this.container.addEventListener('pointerdown', this.mouseDownHandler)
      this.container.addEventListener('wheel', this.mouseWheelHandler, { passive: true })
    } else {
      this.buttonIcon = "mdi-arrow-split-horizontal"
      this.container.removeEventListener('pointerdown', this.mouseDownHandler)
      this.container.removeEventListener('wheel', this.mouseWheelHandler)
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
      this.showButton()
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
    if (dx < 0 && !this.fitWidth) {
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
