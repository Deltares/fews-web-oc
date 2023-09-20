<template>
  <div>
    <vue-slider class="elevation-slider"
      :value="currentValue"
      :max="maxValue"
      :min="minValue"
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
  @Prop({ default: -1 }) value!: number
  @Prop({ default: 0 }) minValue!: number
  @Prop({ default: -10 }) maxValue!: number

  currentValue: number = 0
  readonly numberOfMarks: number = 8
  marks: number[] = []

  beforeMount() {
    this.currentValue = this.value
  }

  mounted() {
    const innerMarks = Array.from({length: this.numberOfMarks - 1}, (_, i) => (i + 1) * -roundToNearest100(this.stepSize))
    this.marks = [this.maxValue, ...innerMarks, this.minValue]
  }

  get interval(): number {
    const difference = Math.abs(this.maxValue - this.minValue)
    return difference / Math.round(difference)
  }

  @Watch("value")
  onValueChange() {
    this.currentValue = this.value
  }

  onKeydown(e: KeyboardEvent) {
    let newValue: number | undefined = 0;

    switch (e.key) {
      case "ArrowLeft":
      case "ArrowUp":
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore: findLast not defined for ts array type, fixed in ts-5.0
        newValue = this.marks.findLast((value) => value > this.currentValue);

        if (newValue === undefined) {
          newValue = this.marks[0]
        }
        break;
      case "ArrowRight":
      case "ArrowDown":
        newValue = this.marks.find((value) => value < this.currentValue);

        if (newValue === undefined) {
          newValue = this.marks[this.marks.length - 1]
        }
        break;
      default:
        return false;
    }

    const slider = this.$refs.slider as VueSlider
    slider.setValue(newValue)
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
.vue-slider-dot-tooltip-text {
  font-family: var(--font-primary)
}

.elevation-slider {
  z-index: 100;
  position: absolute;
  right: 20px;
  bottom: 50px;
}
</style>
