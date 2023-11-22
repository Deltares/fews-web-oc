<template>
  <div id="legend" :class="isVisible ? 'invisible' : ''">
    <svg id="colourbar" class="colourbar" :class="[
                                $vuetify.breakpoint.mobile ? 'colourbar-mobile' : 'colourbar-desktop',
                                $vuetify.theme.dark ? 'colourbar-dark' : 'colourbar-light'
                                ]"/>
    <LegendInput :value.sync="range.min" :maxValue="range.max" offset="10px" :isEditing.sync="isEditingMin"/>
    <LegendInput :value.sync="range.max" :minValue="range.min" offset="405px" :isEditing.sync="isEditingMax"/>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import * as d3 from 'd3'
import * as webOcCharts from '@deltares/fews-web-oc-charts'
import LegendInput from '@/components/LegendInput.vue'

@Component({
  components: {
    LegendInput
  }
})
export default class ColourBar extends Vue {
  @Prop({ default: () => { return [] }}) value!: webOcCharts.ColourMap
  @Prop({ default: ("") }) title!: string

  group: any
  colourBar?: webOcCharts.ColourBar
  isVisible: boolean = false
  range = {
    min: 0,
    max: 1
  }
  isEditingMin = false
  isEditingMax = false

  mounted() {
    const svg = d3.select("#colourbar")
    this.group = svg.append('g')
      .attr('transform', 'translate(25, 30)')
    this.updateColourBar()
  }

  @Watch('$vuetify.breakpoint.mobile')
  onMobileBreakpoint() {
    this.updateColourBar()
  }

  @Watch('value')
  updateColourBar() {
    if (!this.value) return

    // Remove possible previous colour map.
    this.group.selectAll("*").remove()
    // Create new colour bar and make it visible.
    const options: webOcCharts.ColourBarOptions = {
      type: 'nonlinear',
      useGradients: true,
      position: webOcCharts.AxisPosition.Bottom,
      title: this.title
    }
    this.colourBar = new webOcCharts.ColourBar(
      this.group as any,
      this.value,
      this.$vuetify.breakpoint.mobile ? 250 : 400, 30,
      options)
    this.isVisible = true

    const firstChild = d3.select("#colourbar > g > g.axis").selectChild()
    const lastChild = d3.select("#colourbar > g > g.axis").selectChild(':last-child')

    this.range.min = this.value[0].lowerValue
    this.range.max = this.value[this.value.length - 1].lowerValue

    firstChild.on('click', () => this.isEditingMin = true)
    lastChild.on('click', () => this.isEditingMax = true)
  }

  @Watch('range', {deep: true})
  updatedRange() {
    this.$emit("rangeUpdate", `${this.range.min},${this.range.max}`)
  }
}
</script>

<style scoped>
  #legend .invisible {
    display: none
  }

  .colourbar {
    fill: none;
    width: 450px;
    height: 85px;
    border-radius: 7px;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
  }

  :deep(g) {
    font-family: var(--primary-font);
  }

  :deep(svg text) {
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
    font-size: 1rem;
    font-weight: 400;
  }

  .colourbar-light {
    text-shadow:  #FFF 0px 0px 1px,
                  #FFF 0px 0px 1px,
                  #FFF 0px 0px 1px,
                  #FFF 0px 0px 1px,
                  #FFF 0px 0px 1px,
                  #FFF 0px 0px 1px;
  }

  .colourbar-dark {
    text-shadow:  #000 0px 0px 1px,
                  #000 0px 0px 1px,
                  #000 0px 0px 1px,
                  #000 0px 0px 1px,
                  #000 0px 0px 1px,
                  #000 0px 0px 1px;
  }

  .colourbar-mobile {
    max-width: 300px;
  }

  .colourbar-desktop {
    max-width: 450px;
  }
</style>
