<template>
  <div class="ssd-container" ref="ssd-container" id="ssd-container" v-resize="resize">
    <v-sheet class="tile-grid-content" :class="{hidden: isHidden}" :width="width" :height="height" color="transparent">
      <schematic-status-display :src="src">
      </schematic-status-display>
    </v-sheet>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'

@Component
export default class SsdComponent extends Vue {
  @Prop({ default: '' })
  src!: string

  container!: HTMLElement
  width = 100
  height = 100
  isHidden = false

  mounted (): void {
    this.container = this.$refs['ssd-container'] as HTMLElement
    this.resize()
  }

  resize (): any {
    if (this.container === undefined) return '100%'
    this.isHidden = true
    this.$nextTick(() => {
      this.height = this.container.clientHeight
      this.width = this.container.clientHeight * this.aspectRatio
      this.isHidden = false
    })
  }

  get aspectRatio (): number {
    return 1.36
  }
}
</script>

<style scoped>
.ssd-container {
  height: 100%;
  width: 100%;
  display: flex;
  background-color: lightgray;
  flex-direction: column;
  overflow-x: auto;
  white-space: nowrap;
}

.tile-grid-content {
  margin: auto;
  flex: 1 1 100px
}

.tile-grid-content.hidden {
  display: none;
}

</style>
