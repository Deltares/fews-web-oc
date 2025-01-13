<template>
  <DashboardDisplay v-if="dashboard" :dashboard="dashboard" />
  <v-alert v-else>No dashboard available</v-alert>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useComponentSettingsStore } from '@/stores/componentSettings'
import DashboardDisplay from '@/components/general/DashboardDisplay.vue'
import type { TopologyNode } from '@deltares/fews-pi-requests'
import { useDashboardsStore } from '@/stores/dashboards'
import {
  UserSettingsWithIcon,
  useUserSettingsStore,
} from '@/stores/userSettings'
import { BaseMap } from '@/lib/topology/componentSettings'

interface Props {
  topologyNode?: TopologyNode
}

const props = defineProps<Props>()

const componentSettingsStore = useComponentSettingsStore()
const dashboardsStore = useDashboardsStore()
const userSettings = useUserSettingsStore()

onMounted(async () => {
  dashboardsStore.fetchState()
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

const dashboard = computed(() => {
  if (!props.topologyNode) return
  return dashboardsStore.getDashboardById(props.topologyNode.id)
})
</script>
