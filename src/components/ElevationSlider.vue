<template>
  <div>
    <vue-slider class="elevation-slider"
      :value="currentValue"
      :max="max"
      :min="min"
      :marks="marks"
      :interval="interval"
      :keydownHook="onKeydown"
      v-on:change="onInputChange"
      :hideLabel="true"
      lazy direction="btt" tooltip="always" tooltipPlacement="left" height="200px" ref="slider">
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


function roundToNearest100 (x: number) {
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
  readonly numberOfMarks: number = 8
  marks: number[] = []

  mounted() {
    this.onValueChange()

    const innerMarks = Array.from({length: this.numberOfMarks - 1}, (_, i) => (i + 1) * -roundToNearest100(this.stepSize))
    this.marks = [this.maxValue, ...innerMarks, this.minValue]
  }

  get interval(): number {
    const difference = Math.abs(this.max - this.min)
    return difference / Math.round(difference)
  }

  get max(): number {
    return Math.max(this.maxValue, 0)
  }

  get min(): number {
    return Math.min(this.minValue, -100)
  }

  @Watch("value")
  onValueChange() {
    this.currentValue = this.value
  }

  onKeydown(e: KeyboardEvent) {
    const slider = this.$refs.slider as VueSlider

    const indexAfterValue = this.marks.findIndex((value) => value < this.currentValue);
    const nextIndex = indexAfterValue === -1 ? this.marks.length - 1 : indexAfterValue;
    const previousIndex = indexAfterValue === -1 ? nextIndex : indexAfterValue - 1

    let newMarkIndex = 0;
    const isOnMark = this.marks.includes(this.currentValue)
    switch (e.key) {
      case "ArrowLeft":
      case "ArrowUp":
        newMarkIndex = previousIndex;

        // if we are currently on a mark our previous index is the current index
        if (isOnMark) {
          newMarkIndex -= 1
        }
        break;
      case "ArrowRight":
      case "ArrowDown":
        newMarkIndex = nextIndex;
        break;
      default:
        return false;
    }

    newMarkIndex = Math.max(newMarkIndex, 0)
    slider.setValue(this.marks[newMarkIndex])
    return false
  }

  get stepSize() {
    return Math.abs(this.maxValue - this.minValue) / this.numberOfMarks
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
