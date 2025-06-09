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

function getDashboardItem(items: WebOCDashboardItem[]) {
  const _actionId = activeActionId.value
  if (_actionId === undefined) return items[0]

  const item = items.find((item) => item.actionIds?.includes(_actionId))
  return item ?? items[0]
}
</script>
