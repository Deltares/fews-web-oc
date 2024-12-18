<template>
  <DashboardDisplay v-if="dashboard" :dashboard="dashboard" />
  <v-alert v-else>No dashboard available</v-alert>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useComponentSettingsStore } from '@/stores/componentSettings'
import DashboardDisplay from '@/components/general/DashboardDisplay.vue'
import type { TopologyNode } from '@deltares/fews-pi-requests'
import { useDashboardsStore } from '@/stores/dashboards'

interface Props {
  topologyNode?: TopologyNode
}

const props = defineProps<Props>()

const componentSettingsStore = useComponentSettingsStore()
componentSettingsStore.fetchState()

const dashboardsStore = useDashboardsStore()
dashboardsStore.fetchState()

const dashboard = computed(() => {
  if (!props.topologyNode) return
  return dashboardsStore.getDashboardById(props.topologyNode.id)
})
</script>
