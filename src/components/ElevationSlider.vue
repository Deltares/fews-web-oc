<template>
  <div>
    <vue-slider class="elevation-slider"
      :value="currentValue"
      :marks="marks"
      v-on:change="onInputChange"
      :hideLabel="true"
      lazy direction="btt" tooltip="always" tooltipPlacement="left" height="200px">
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

@Component({
  components: {
    VueSlider
  }
})
export default class ElevationSlider extends Vue {
  @Prop({ default: -1 }) value!: number
  @Prop({ default: 0 }) minValue!: number
  @Prop({ default: -10 }) maxValue!: number
  @Prop({ default: () => [0, -1, -2]}) marks!: number[]

  currentValue: number = 0

  beforeMount() {
    this.currentValue = this.value
  }

  @Watch("value")
  onValueChange() {
    this.currentValue = this.value
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
  bottom: 50px;
}
</style>
