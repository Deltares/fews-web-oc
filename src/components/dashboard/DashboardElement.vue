<template>
  <v-card
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
      @dashboardAction="emit('dashboardAction', $event)"
    />
  </v-card>
</template>

<script setup lang="ts">
import DashboardItem from '@/components/dashboard/DashboardItem.vue'
import type {
  WebOCDashboardItem,
  WebOCDashboardElement,
} from '@deltares/fews-pi-requests'
import type { DashboardActionEventBus } from '@/lib/topology/dashboardActions'
import type { ComponentSettings } from '@/lib/topology/componentSettings'
import type { SsdActionResult } from '@deltares/fews-ssd-requests'
import { provideMapId } from '@/services/useMapId'

interface Props {
  actionId: string | undefined
  actionEventBus: DashboardActionEventBus
  element: WebOCDashboardElement
  settings?: ComponentSettings
}

const props = defineProps<Props>()

interface Emits {
  dashboardAction: [result: SsdActionResult]
}
const emit = defineEmits<Emits>()

// NOTE: Maybe require elements to have an id so we don't have to
//       use the gridTemplateArea as an id
provideMapId(props.element.gridTemplateArea)

function getDashboardItem(items: WebOCDashboardItem[]) {
  const actionId = props.actionId
  if (actionId === undefined) return items[0]

  const item = items.find((item) => item.actionIds?.includes(actionId))
  return item ?? items[0]
}
</script>
