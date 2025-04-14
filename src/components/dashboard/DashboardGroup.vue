<template>
  <v-card
    v-for="element in group.elements"
    :style="{ gridArea: element.gridTemplateArea }"
    class="d-flex flex-column"
    density="compact"
    flat
    :rounded="false"
  >
    <DashboardItem
      v-if="element.items"
      :item="getDashboardItem(element.items)"
      :siblings="element.items"
      :action-id="actionId"
      :action-params="actionParams"
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
import type { DashboardActionParams } from '@/lib/topology/dashboardActions'
import type { ComponentSettings } from '@/lib/topology/componentSettings'

interface Props {
  group: WebOCDashboardGroup
  settings?: ComponentSettings
}

defineProps<Props>()

const actionId = ref<string>()
const actionParams = ref<DashboardActionParams>({})
function onDashboardAction(action: SsdActionResult) {
  actionId.value = action.actionId
  actionParams.value = {
    charts: action.charts,
    map: action.map,
  }
}

function getDashboardItem(items: WebOCDashboardItem[]) {
  const _actionId = actionId.value
  if (_actionId === undefined) return items[0]

  const item = items.find((item) => item.actionIds?.includes(_actionId))
  return item ?? items[0]
}
</script>
