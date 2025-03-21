<template>
  <TimeSeriesDisplay :nodeId="topologyNodeId" />
</template>

<script setup lang="ts">
import TimeSeriesDisplay from '@/components/timeseries/TimeSeriesDisplay.vue'

interface Props {
  topologyNodeId?: string
}

defineProps<Props>()
</script>
