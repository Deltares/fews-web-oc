<template>
  <div class="ssd-container" ref="ssd-container" id="ssd-container" v-resize="resize">
    <div class="tile-grid-content" :class="{hidden: isHidden}" :style="{width: width + 'px', height: height + 'px', 'margin-left': this.margin + 'px' }" ref="scroll-content">
      <schematic-status-display :src="src" ref="ssd" @load="onLoad">
      </schematic-status-display>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'

@Component
export default class SsdComponent extends Vue {
  @Prop({ default: '' })
  src!: string

  container!: HTMLElement
  scrollContainer!: HTMLElement
  width = 100
  height = 100
  margin = 0
  isHidden = false
  pos = { top: 0, left: 0, x: 0, y: 0 };
  aspectRatio = 1

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
    this.container.style.cursor = 'inherit'
    this.container.style.removeProperty('user-select')
  }

  onLoad (): void {
    this.resize()
  }

  mounted (): void {
    this.container = this.$refs['ssd-container'] as HTMLElement
    this.resize()
    document.addEventListener('pointerdown', this.mouseDownHandler)
  }

  @Watch('src')
  resize (): any {
    if (this.container === undefined) return '100%'
    this.isHidden = true
    this.$nextTick(() => {
      this.setAspectRatio()
      let height = this.container.clientHeight
      const margin = this.container.clientWidth - height * this.aspectRatio
      if (margin < 0) {
        height = height - 15
        this.margin = 0
      } else {
        this.margin = margin / 2
      }
      this.height = height
      this.width = height * this.aspectRatio
      this.isHidden = false
    })
  }

  setAspectRatio (): void {
    const svgContainer = this.$refs.ssd as HTMLElement
    if (svgContainer && svgContainer.firstChild) {
      const svg = svgContainer.firstChild as SVGElement
      const sizes = svg.getAttribute('viewBox')!.split(' ', 4).map(x => +x) as [number, number, number, number]
      this.aspectRatio = +sizes[2] / +sizes[3]
    } else {
      this.aspectRatio = 1
    }
  }
}
</script>

<style>
.ssd-container {
  height: 100%;
  width: 100%;
  display: flex;
  background-color: white;
  flex-direction: column;
  overflow-x: auto;
  white-space: nowrap;
}

.tile-grid-content {
  display: flex;
  flex: 1 1 100px
}

.tile-grid-content.hidden {
  display: none;
}
</style>
