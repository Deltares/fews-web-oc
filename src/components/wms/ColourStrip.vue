<template>
  <svg class="colourstrip">
    <g
      ref="groupRef"
      style="pointer-events: 'visiblePainted'"
      transform="translate(-1, 0)"
    ></g>
  </svg>
</template>

<script setup lang="ts">
import { onMounted, ref, watch, computed } from 'vue'
import { select } from 'd3'
import {
  type ColourMap,
  type ColourBarOptions,
  ColourBar,
  AxisPosition,
} from '@deltares/fews-web-oc-charts'

interface Props {
  colourMap?: ColourMap
  useGradients?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  useGradients: true,
})

const groupRef = ref(null)
const group = computed(() => select(groupRef.value))

onMounted(updateColourStrip)
watch(props, updateColourStrip)

function updateColourStrip() {
  if (!props.colourMap) return
  if (!group.value) return

  group.value.selectAll('*').remove()

  const options: ColourBarOptions = {
    type: 'nonlinear',
    useGradients: props.useGradients,
    position: AxisPosition.Bottom,
    ticks: 0,
  }
  new ColourBar(group.value as any, props.colourMap, 200, 10, options)
}
</script>

<style scoped>
.colourstrip {
  width: 200px;
  height: 10px;
}

:deep(g) {
  pointer-events: none;
}
</style>
