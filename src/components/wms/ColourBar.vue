<template>
  <div id="legend" :class="isVisible ? 'invisible' : ''">
    <svg id="colourbar" class="colourbar"></svg>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import * as d3 from 'd3'
import * as webOcCharts from '@deltares/fews-web-oc-charts'

interface Props {
  colourMap?: webOcCharts.ColourMap
}

const props = withDefaults(defineProps<Props>(), {
  colourMap: undefined,
})

const isVisible = ref<boolean>(true)
let group: d3.Selection<SVGGElement, unknown, HTMLElement, any>

watch(
  () => props.colourMap,
  () => {
    updateColourBar()
  },
)

onMounted(() => {
  const svg = d3.select('#colourbar')
  group = svg.append('g').attr('transform', 'translate(10, 0)')
  updateColourBar()
})

function updateColourBar() {
  if (!props.colourMap) return
  if (group == undefined) return

  isVisible.value = false
  // Remove possible previous colour map.
  group.selectAll('*').remove()
  // Create new colour bar and make it visible.
  const options: webOcCharts.ColourBarOptions = {
    type: 'nonlinear',
    useGradients: true,
    position: webOcCharts.AxisPosition.Bottom,
  }
  new webOcCharts.ColourBar(group as any, props.colourMap, 250, 10, options)
  isVisible.value = true
}
</script>

<style scoped>
#legend .invisible {
  display: none;
}

.colourbar {
  fill: none;
  width: 265px;
  height: 31px;
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
  font-size: 1em;
}
</style>
