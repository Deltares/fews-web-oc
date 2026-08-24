<template>
  <DashboardDisplay v-if="dashboard" :dashboard="dashboard" />
  <v-alert v-else-if="dashboardId && isReady">No dashboard available</v-alert>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import DashboardDisplay from '@/components/dashboard/DashboardDisplay.vue'
import type { TopologyNode } from '@deltares/fews-pi-requests'
import { useDashboard } from '@/services/useDashboard'
import { configManager } from '@/services/application-config'

interface Props {
  topologyNode?: TopologyNode
}

const props = defineProps<Props>()

const dashboardId = computed(() => props.topologyNode?.dashboardPanels?.[0]?.id)

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
const { dashboard, isReady } = useDashboard(baseUrl, dashboardId)
</script>
