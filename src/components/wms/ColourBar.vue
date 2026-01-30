<template>
  <div
    id="legend"
    :class="isVisible ? 'invisible' : ''"
    class="legend_container"
  >
    <svg ref="colourbarElement" class="map__colour-bar"></svg>
    <LegendInput
      parentId="min-legend"
      v-model:value="range.min"
      :maxValue="range.max"
      v-model:isEditing="isEditingMin"
    />
    <LegendInput
      parentId="max-legend"
      v-model:value="range.max"
      :minValue="range.min"
      v-model:isEditing="isEditingMax"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { select, type Selection } from 'd3'
import {
  ColourBar,
  ColourBarOptions,
  ColourMap,
  AxisPosition,
} from '@deltares/fews-web-oc-charts'
import LegendInput from '@/components/wms/LegendInput.vue'

type Range = {
  min: number
  max: number
}

interface Props {
  colourMap?: ColourMap
  title?: string
  useGradients?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  useGradients: true,
})

const range = defineModel<Range>('range', { required: true })

const colourbarElement = ref<SVGElement>()

const isVisible = ref<boolean>(true)

const isEditingMin = ref<boolean>(false)
const isEditingMax = ref<boolean>(false)
let group: Selection<SVGGElement, unknown, null, unknown>

onMounted(() => {
  if (colourbarElement.value !== undefined) {
    const svg = select(colourbarElement.value)
    group = svg
      .append('g')
      .attr('transform', 'translate(25, 25)')
      .style('pointer-events', 'visiblePainted')
    updateColourBar()
  }
})

watch(props, updateColourBar)

function updateColourBar() {
  if (!props.colourMap) return
  if (group == undefined) return

  isVisible.value = false
  // Remove possible previous colour map.
  group.selectAll('*').remove()
  // Create new colour bar and make it visible.
  const options: ColourBarOptions = {
    type: 'nonlinear',
    useGradients: props.useGradients,
    position: AxisPosition.Bottom,
    title: props.title,
  }
  new ColourBar(group as any, props.colourMap, 250, 10, options)
  isVisible.value = true

  const firstChild = select('#colourbar > g > g.axis').selectChild()
  const lastChild = select('#colourbar > g > g.axis').selectChild(':last-child')

  firstChild.on('click', () => (isEditingMin.value = true))
  lastChild.on('click', () => (isEditingMax.value = true))
  firstChild.attr('id', 'min-legend')
  lastChild.attr('id', 'max-legend')
}
</script>

<style scoped>
#legend .invisible {
  display: none;
}

.map__colour-bar {
  width: 300px;
  height: 60px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.map__colour-bar :deep(text) {
  fill: white !important;
  text-rendering: optimizeLegibility;
  text-shadow:
    -1px 0 1px rgba(0, 0, 0, 0.6),
    1px 0 1px rgba(0, 0, 0, 0.6),
    0 1px 1px rgba(0, 0, 0, 0.6),
    0 -1px 1px rgba(0, 0, 0, 0.6);
}

.map__colour-bar :deep(.axis .tick line) {
  stroke: white;
  stroke-width: 1px;
  filter: drop-shadow(-1px 0 0.5px rgba(0, 0, 0, 0.3))
    drop-shadow(1px 0 0.5px rgba(0, 0, 0, 0.3))
    drop-shadow(0 1px 0.5px rgba(0, 0, 0, 0.3))
    drop-shadow(0 -1px 0.5px rgba(0, 0, 0, 0.3));
  shape-rendering: crispEdges;
}

.map__colour-bar :deep(.grid) {
  stroke: white;
}

:deep(g) {
  pointer-events: none;
  font-family: var(--primary-font);
}

:deep(svg text) {
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  font-size: 1em;
}

:deep(#min-legend) {
  cursor: pointer;
  pointer-events: all;
}

:deep(#max-legend) {
  cursor: pointer;
  pointer-events: all;
}

:deep(.title) {
  font-size: 0.825em;
}
</style>
