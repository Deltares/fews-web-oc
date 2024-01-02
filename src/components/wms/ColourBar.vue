<template>
  <div id="legend" :class="isVisible ? 'invisible' : ''">
    <svg id="colourbar" class="colourbar"></svg>
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
import * as d3 from 'd3'
import * as webOcCharts from '@deltares/fews-web-oc-charts'
import LegendInput from '@/components/wms/LegendInput.vue'

type Range = {
  min: number
  max: number
}

interface Props {
  colourMap?: webOcCharts.ColourMap
  title?: string
  colorScaleRange?: string
}

const props = withDefaults(defineProps<Props>(), {})

const emit = defineEmits(['update:colorScaleRange'])

const isVisible = ref<boolean>(true)
const range = ref<Range>({
  min: props.colorScaleRange
    ? parseFloat(props.colorScaleRange.split(',')[0])
    : 0,
  max: props.colorScaleRange
    ? parseFloat(props.colorScaleRange.split(',')[1])
    : 1,
})

const isEditingMin = ref<boolean>(false)
const isEditingMax = ref<boolean>(false)
let group: d3.Selection<SVGGElement, unknown, HTMLElement, any>

onMounted(() => {
  const svg = d3.select('#colourbar')
  group = svg
    .append('g')
    .attr('transform', 'translate(10, 50)')
    .style('pointer-events', 'visiblePainted')
  updateColourBar()
})

watch(props, () => {
  updateColourBar()
})

watch(
  () => props.colorScaleRange,
  (newColorScaleRange) => {
    const [min, max] = newColorScaleRange?.split(',') ?? '0, 1'
    range.value.min = parseFloat(min)
    range.value.max = parseFloat(max)
  },
)

watch(
  range,
  () => {
    emit('update:colorScaleRange', `${range.value.min},${range.value.max}`)
  },
  { deep: true },
)

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
    title: props.title,
  }
  new webOcCharts.ColourBar(group as any, props.colourMap, 250, 10, options)
  isVisible.value = true

  const firstChild = d3.select('#colourbar > g > g.axis').selectChild()
  const lastChild = d3
    .select('#colourbar > g > g.axis')
    .selectChild(':last-child')

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

.colourbar {
  fill: none;
  width: 300px;
  height: 85px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
  text-shadow:
    rgb(var(--v-theme-background)) 0px 0px 1px,
    rgb(var(--v-theme-background)) 0px 0px 1px,
    rgb(var(--v-theme-background)) 0px 0px 1px,
    rgb(var(--v-theme-background)) 0px 0px 1px,
    rgb(var(--v-theme-background)) 0px 0px 1px,
    rgb(var(--v-theme-background)) 0px 0px 1px;
}

.colourbar :deep(.axis .tick line) {
  filter: drop-shadow(0px 0px 1px rgb(var(--v-theme-background)))
    drop-shadow(0px 0px 1px rgb(var(--v-theme-background)))
    drop-shadow(0px 0px 1px rgb(var(--v-theme-background)));
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
