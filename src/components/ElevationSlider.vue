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
      <template v-slot:tooltip>
        <div class="vue-slider-dot-tooltip-inner vue-slider-dot-tooltip-inner-left vue-slider-dot-tooltip-text" >
          <v-text-field ref="tooltipInput" v-if="isEditingTooltip"
            @keydown.escape.stop="disableTooltipEdit"
            @keydown.enter.stop="acceptTooltipEdit"
            @blur="acceptTooltipEdit"
            v-model.number="currentTooltipValue"
            type="number"
            class="tooltip-input"
          />
          <div v-else @click="enableTooltipEdit">{{ Math.round(currentValue) }} m MSL</div>
        </div>
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

  currentTooltipValue: number = 0
  currentValue: number = 0
  readonly numberOfMarks: number = 8
  marks: number[] = []
  isEditingTooltip: boolean = false

  beforeMount() {
    this.currentValue = this.value
    this.currentTooltipValue = this.currentValue
  }

  mounted() {
    const innerMarks = Array.from({length: this.numberOfMarks - 1}, (_, i) => (i + 1) * -roundToNearest100(this.stepSize))
    this.marks = [this.maxValue, ...innerMarks, this.minValue]
  }


  enableTooltipEdit() {
    this.isEditingTooltip = true
    this.currentTooltipValue = Math.round(this.currentValue)

    this.$nextTick(() => {
      const tooltipInputRef = this.$refs.tooltipInput as HTMLElement
      tooltipInputRef.focus()
    })
  }

  disableTooltipEdit() {
    this.isEditingTooltip = false

    const sliderRef = this.$refs.slider as VueSlider
    sliderRef.focus()
  }

  acceptTooltipEdit() {
    this.currentValue = Math.min(this.maxValue, Math.max(this.minValue, this.currentTooltipValue))
    this.disableTooltipEdit()
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
        this.currentValue = newValue ?? this.marks[0]
        break;
      case "ArrowRight":
      case "ArrowDown":
        newValue = this.marks.find((value) => value < this.currentValue);
        this.currentValue = newValue ?? this.marks[this.marks.length - 1]
        break;
      case "Enter":
        this.enableTooltipEdit()
        break;
    }

    return false
  }

  get stepSize() {
    return Math.abs(this.maxValue - this.minValue) / this.numberOfMarks
  }

  onInputChange(newValue: number) {
    this.$emit("input", newValue)
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
  bottom: 100px;
}

.tooltip-input {
  width: 70px;
  height: 40px;
  margin: 0;
  padding: 0;
}
</style>
