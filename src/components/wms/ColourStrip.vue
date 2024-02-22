<template>
  <svg class="colourstrip">
    <g ref="groupRef" style="pointer-events: 'visiblePainted'"></g>
  </svg>
</template>

<script setup lang="ts">
import { onMounted, ref, watch, computed } from 'vue'
import * as d3 from 'd3'
import * as webOcCharts from '@deltares/fews-web-oc-charts'

interface Props {
  colourMap?: webOcCharts.ColourMap
}

const props = defineProps<Props>()

const groupRef = ref(null)
const group = computed(() => d3.select(groupRef.value))

onMounted(updateColourStrip)
watch(props, updateColourStrip)

function updateColourStrip() {
  if (!props.colourMap) return
  if (!group.value) return

  group.value.selectAll('*').remove()

  const options: webOcCharts.ColourBarOptions = {
    type: 'nonlinear',
    useGradients: true,
    position: webOcCharts.AxisPosition.Bottom,
    ticks: 0,
  }
  new webOcCharts.ColourBar(
    group.value as any,
    props.colourMap,
    230,
    10,
    options,
  )
}
</script>

<style scoped>
.colourstrip {
  width: 230px;
  height: 10px;
}

:deep(g) {
  pointer-events: none;
}
</style>
