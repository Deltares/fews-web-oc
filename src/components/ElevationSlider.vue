<template>
  <div>
    <v-slider 
    class="elevation-slider"
    :value="currentValue"
    :max="maxValue" 
    :min="minValue" 
    vertical
    thumb-label="always"
    @input="onInputChange">
      <template v-slot:prepend>
        <div style="background-color:rgba(0, 0, 0, 0.5);">
          {{Math.round(minValue)}}
        </div>
      </template>
      <template v-slot:append>
        <div style="background-color:rgba(0, 0, 0, 0.5);">
          {{Math.round(maxValue)}}
        </div>
      </template>
    </v-slider>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Watch, Vue } from 'vue-property-decorator'

@Component
export default class ElevationSlider extends Vue {
  @Prop({ default: () => { return 0 } }) value!: number
  @Prop({ default: () => { return 0 } }) minValue!: number
  @Prop({ default: () => { return 0 } }) maxValue!: number

  currentValue: number = 0
  
  mounted(){
    this.onValueChange()
  }

  @Watch("value")
  onValueChange(){
    this.currentValue = this.value
  }

  onInputChange(event: any){
    this.$emit("input", event)
  }
}
</script>

<style scoped>
.elevation-slider {
  z-index: 100;
  position: absolute;
  right: 25px;
  top: 40px;
}

</style>
