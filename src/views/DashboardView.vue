<template>
  <DashboardDisplay v-if="dashboard" :dashboard="dashboard" />
  <v-alert v-else>No dashboard available</v-alert>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useComponentSettingsStore } from '@/stores/componentSettings'
import DashboardDisplay from '@/components/general/DashboardDisplay.vue'
import type { TopologyNode } from '@deltares/fews-pi-requests'
import {
  UserSettingsWithIcon,
  useUserSettingsStore,
} from '@/stores/userSettings'
import { BaseMap } from '@/lib/topology/componentSettings'
import { useDashboard } from '@/services/useDashboard'
import { configManager } from '@/services/application-config'

interface Props {
  topologyNode?: TopologyNode
}

const props = defineProps<Props>()

const componentSettingsStore = useComponentSettingsStore()
const userSettings = useUserSettingsStore()

onMounted(async () => {
  await componentSettingsStore.fetchState()
  updateUserSettingBaseMaps()
})

function updateUserSettingBaseMaps() {
  // FIXME: Remove once baseMaps have moved out of the component settings
  const items = componentSettingsStore.baseMaps.map(convertBaseMapToUserSetting)
  const current = userSettings.get('ui.map.theme')
  if (current?.type !== 'oneOfMultiple') return
  current.items = items
}

function convertBaseMapToUserSetting(baseMap: BaseMap): UserSettingsWithIcon {
  return {
    value: baseMap.id,
    icon: baseMap.icon,
  }
}

const dashboardId = computed(() => props.topologyNode?.dashboardPanels?.[0]?.id)

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
const { dashboard } = useDashboard(baseUrl, dashboardId)
</script>
