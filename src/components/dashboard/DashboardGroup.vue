<template>
  <DashboardElement
    v-for="element in group.elements"
    :actionId="activeActionId"
    :actionEventBus="actionEventBus"
    :element="element"
    :settings="settings"
    @dashboardAction="onDashboardAction"
  />
</template>

<script setup lang="ts">
import DashboardElement from '@/components/dashboard/DashboardElement.vue'
import type { WebOCDashboardGroup } from '@deltares/fews-pi-requests'
import { ref } from 'vue'
import type { SsdActionResult } from '@deltares/fews-ssd-requests'
import type { DashboardActionEventBus } from '@/lib/topology/dashboardActions'
import type { ComponentSettings } from '@/lib/topology/componentSettings'

interface Props {
  group: WebOCDashboardGroup
  settings?: ComponentSettings
}

defineProps<Props>()

const activeActionId = ref<string>()
function onDashboardAction(action: SsdActionResult) {
  activeActionId.value = action.actionId
  actionEventBus.value = {
    trigger: actionEventBus.value.trigger + 1,
    payload: {
      actionId: action.actionId,
      charts: action.charts,
      map: action.map,
    },
  }
}

const actionEventBus = ref<DashboardActionEventBus>({
  trigger: 0,
  payload: {},
})
</script>
