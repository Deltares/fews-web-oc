<template>
  <v-card
    v-for="element in group.elements"
    :style="{ gridArea: element.gridTemplateArea }"
    class="d-flex flex-column"
    density="compact"
    flat
    rounded
    border
  >
    <DashboardItem
      v-if="element.items"
      :item="getDashboardItem(element.items)"
      :siblings="element.items"
      :actionEventBus="actionEventBus"
      :settings="settings"
      @dashboardAction="onDashboardAction"
    />
  </v-card>
</template>

<script setup lang="ts">
import DashboardItem from '@/components/dashboard/DashboardItem.vue'
import type {
  WebOCDashboardItem,
  WebOCDashboardGroup,
} from '@deltares/fews-pi-requests'
import { ref } from 'vue'
import type { SsdActionResult } from '@deltares/fews-ssd-requests'
import type { DashboardActionEventBus } from '@/lib/topology/dashboardActions'
import type { ComponentSettings } from '@/lib/topology/componentSettings'
import { provideMapSync } from '@/services/useMapSync'
import { provideSelectedElevation } from '@/services/useSelectedElevation'
import { provideChartHandlers } from '@/services/useChartHandlers'

interface Props {
  group: WebOCDashboardGroup
  settings?: ComponentSettings
}

defineProps<Props>()

// Provide group level shared state
provideMapSync()
provideSelectedElevation()
provideChartHandlers()

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

function getDashboardItem(items: WebOCDashboardItem[]) {
  const _actionId = activeActionId.value
  if (_actionId === undefined) return items[0]

  const foundItem = items.find((item) => item.actionIds?.includes(_actionId))
  return foundItem ?? items[0]
}
</script>
