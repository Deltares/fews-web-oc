<template>
  <div id="legend" :class="isVisible ? 'invisible' : ''">
    <svg id="colourbar" width="500" height="100" style="fill:none;"></svg>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import * as d3 from 'd3'
import * as webOcCharts from '@deltares/fews-web-oc-charts'

@Component([])
export default class ColourBar extends Vue {
  @Prop({ default: () => { return [] }}) value!: webOcCharts.ColourMap

  group: any
  colourBar?: webOcCharts.ColourBar
  isVisible: boolean = false

  mounted() {
    const svg = d3.select("#colourbar")
    this.group = svg.append('g')
      .attr('transform', 'translate(50, 50)')
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
      position: webOcCharts.AxisPosition.Bottom
    }
    this.colourBar = new webOcCharts.ColourBar(
      this.group as any,
      this.value,
      this.$vuetify.breakpoint.mobile ? 250 : 400, 30,
      options)
    this.isVisible = true
  }
}
</script>

<style scoped>
  #legend .invisible {
    display: none
  }
</style>
