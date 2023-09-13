<template>
  <div>
    <vue-slider class="elevation-slider" :value="currentValue" :max="maxValue" :min="minValue" :marks="marks" :interval="interval" lazy :keydownHook="onKeydown"
      direction="btt" tooltip="always" tooltipPlacement="left" height="200px" v-on:change="onInputChange" :hideLabel="true" ref="slider">
      <template v-slot:tooltip="{ value }">
        <div class="vue-slider-dot-tooltip-inner vue-slider-dot-tooltip-inner-left vue-slider-dot-tooltip-text">{{
          Math.round(value) }} m MSL</div>
      </template>
    </vue-slider>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Watch, Vue } from 'vue-property-decorator'
import VueSlider from 'vue-slider-component'
import 'vue-slider-component/theme/default.css'


function roundToNearest100(x: number) {
  return Math.round(x / 100) * 100
}


@Component({
  components: {
    VueSlider
  }
})
export default class ElevationSlider extends Vue {
  @Prop({ default: 0 }) value!: number
  @Prop({ default: 0 }) minValue!: number
  @Prop({ default: 0 }) maxValue!: number

  currentValue: number = 0
  readonly stepDivision: number = 8
  marks: number[] = []

  mounted() {
    this.onValueChange()

    const innerMarks = Array.from({length: this.stepDivision - 1}, (_, i) => (i + 1) * -roundToNearest100(this.stepSize))
    this.marks = [this.maxValue, ...innerMarks, this.minValue]
  }

  get interval() {
    const difference = Math.abs(this.maxValue - this.minValue) 
    return difference / Math.round(difference)
  }

  @Watch("value")
  onValueChange() {
    this.currentValue = this.value 
  }

  onKeydown(e: KeyboardEvent) {
    const slider = this.$refs.slider as VueSlider
    
    let nextIndex = this.marks.findIndex((value) => value < this.currentValue)
    nextIndex = nextIndex == -1 ? this.marks.length - 1 : nextIndex 

    let previousIndex = this.currentValue === this.marks[nextIndex - 1] ? nextIndex - 2 : nextIndex - 1
    previousIndex = previousIndex < 0 ? 0 : previousIndex

    let nextMarkIndex = 0
    switch (e.key) {
      case "ArrowRight":
        nextMarkIndex = previousIndex
        break;
      case "ArrowLeft":
        nextMarkIndex = nextIndex
        break;
      case "ArrowUp":
        nextMarkIndex = previousIndex
        break;
      case "ArrowDown":
        nextMarkIndex = nextIndex
        break;
      default:
        return false
    }

    slider.setValue(this.marks[nextMarkIndex])
    return false
  }

  get stepSize() {
    return Math.abs(this.maxValue - this.minValue) / this.stepDivision 
  }

  onInputChange(event: Event) {
    this.$emit("input", event)
  }
}
</script>

<style scoped>
.elevation-slider {
  z-index: 100;
  position: absolute;
  right: 20px;
  bottom: 50px;
}
</style>
