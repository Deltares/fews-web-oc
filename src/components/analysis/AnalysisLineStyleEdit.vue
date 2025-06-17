<template>
  <v-select
    v-model="lineStyle"
    :items="lineStyles"
    density="compact"
    variant="outlined"
    width="150"
    item-value="value"
    item-title="label"
    hide-details
    label="Line Style"
  />
</template>

<script setup lang="ts">
import { lineStyles } from '@/lib/charts/styles'
import type { TimeSeriesDisplaySubplotItem } from '@deltares/fews-pi-requests'
import { computed } from 'vue'

interface Props {
  item: TimeSeriesDisplaySubplotItem
}

const props = defineProps<Props>()

const lineStyle = computed({
  get: () => props.item.lineStyle?.split(';')[0],
  set: (value) => {
    const currentStyle = props.item.lineStyle ?? ''
    const currentEnding = currentStyle.split(';')[1]
    const newStyle = value + (currentEnding ? `;${currentEnding}` : '')
    props.item.lineStyle = newStyle
  },
})
</script>
