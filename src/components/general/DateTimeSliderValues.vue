<template>
  <div ref="container" class="d-flex" :style="{ height }"></div>
</template>

<script setup lang="ts">
import * as d3 from 'd3'
import { onMounted, useTemplateRef, watchEffect } from 'vue'

import { TimeSeriesData } from '@/lib/timeseries/types/SeriesData'

import { ColourScale } from '@/stores/colourScales'

interface Props {
  values: TimeSeriesData[]
  colourScale: ColourScale | null
  height: string
}
const props = withDefaults(defineProps<Props>(), { height: '5px' })

const container = useTemplateRef<HTMLDivElement>('container')

const viewboxWidth = 100
const viewboxHeight = 10
let svg: d3.Selection<SVGSVGElement, undefined, null, undefined> | null = null

onMounted(() => {
  if (!container.value) throw new Error('Container does not exist.')

  // We set the viewbox width and height to arbitrary values, then stretch the
  // SVG to the appropriate size, ignoring its aspect ratio.
  svg = d3
    .create('svg')
    .attr('viewBox', `0 0 ${viewboxWidth} ${viewboxHeight}`)
    .attr('preserveAspectRatio', 'none')
    .attr('shape-rendering', 'crispEdges')
    .style('width', '100%')
    .style('height', '100%')

    .attr('role', 'img')
    .attr('aria-labelledby', 'time-max-title time-max-desc')
    .attr('focusable', 'false')

  svg
    .append('title')
    .attr('id', 'time-max-title')
    .text('Maximum value per time step')
  svg
    .append('desc')
    .attr('id', 'time-max-desc')
    .text(
      'Chart showing spatially aggregated maximum values for each available time in the time slider.',
    )

  container.value.replaceChildren(svg.node()!)

  // Only set the watcher after we have created the SVG.
  watchEffect(updateSliderValues)
})

interface SliderEvent {
  index: number
  value: number | null
}

function updateSliderValues(): void {
  if (!svg) throw new Error('SVG element has not been created.')

  // We cannot create the coloured blocks without a colour scale. Once it is
  // defined, this should execute again.
  if (!props.colourScale) return

  // Create colour scale based on the current WMS colour map.
  const domain = props.colourScale.colourMap.map((entry) => entry.lowerValue)
  const range = props.colourScale.colourMap.map((entry) => entry.color)
  const scale = d3.scaleLinear<string>().domain(domain).range(range).clamp(true)

  // We want the centres of the coloured blocks to align with the slider
  // positions, so we need to start and end with half a block width.
  const numValues = props.values.length
  const blockWidth = viewboxWidth / (numValues - 1)
  const widthFunc = (data: SliderEvent) => {
    const isEdge = data.index === 0 || data.index === numValues - 1
    return isEdge ? blockWidth / 2 : blockWidth
  }
  const xFunc = (data: SliderEvent) => {
    const isStart = data.index === 0
    return isStart ? 0 : data.index * blockWidth - blockWidth / 2
  }
  const colourFunc = (data: SliderEvent) => {
    if (data.value === null) return 'rgb(0, 0, 0, 0)'
    return scale(data.value)
  }

  // Create a <rect> element for each data point that should align nicely with
  // the centres of the slider positions.
  const eventData: SliderEvent[] = props.values.map((event, index) => ({
    index,
    value: event.y,
  }))
  svg
    .selectAll('rect')
    .data(eventData)
    .join('rect')
    .attr('x', xFunc)
    .attr('width', widthFunc)
    .attr('height', viewboxHeight)
    .attr('fill', colourFunc)
}
</script>
