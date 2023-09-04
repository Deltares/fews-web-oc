<template>
  <div>
    <vue-slider class="elevation-slider" :value="currentValue" :max="maxValue" :min="minValue" :interval="stepSize" marks
      direction="btt" tooltip="always" tooltipPlacement="left" height="200px" v-on:change="onInputChange" :hideLabel="true">
      <template v-slot:tooltip="{ value }">
        <div class="vue-slider-dot-tooltip-inner vue-slider-dot-tooltip-inner-left vue-slider-dot-tooltip-text">{{
          Math.round(value) }} meter</div>
      </template>
    </vue-slider>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Watch, Vue } from 'vue-property-decorator'
import VueSlider from 'vue-slider-component'
import 'vue-slider-component/theme/default.css'

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

  mounted() {
    this.onValueChange()
  }

  @Watch("value")
  onValueChange() {
    this.currentValue = this.value
  }

  get stepSize() {
    return Math.abs(this.maxValue - this.minValue) / 8
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
  top: 50px;
}
</style>
