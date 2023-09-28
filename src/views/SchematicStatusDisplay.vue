<template>
  <Teleport to="#web-oc-sidebar-target">
    <ColumnMenu
      rootName="Overzichtsschermen"
      :active.sync="active"
      :items="items"
      :open.sync="open"
    >
    </ColumnMenu>
  </Teleport>
  <div class="container">
    <SsdComponent :src="src" @action="onAction" />
    <DateTimeSlider v-model:selectedDate="selectedDateSlider" :dates="dates" />
  </div>
</template>

<script setup lang="ts">
import {
  ActionType,
  DisplayGroup,
  DisplayPanel,
  Result,
  ResultRequest,
} from '@deltares/fews-ssd-requests'
import debounce from 'lodash-es/debounce'
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { useAlertsStore } from '../stores/alerts.ts'

import { configManager } from '../services/application-config/index.ts'
import type { ColumnItem } from '../components/general/ColumnItem'

import { useSsd } from '../services/useSsd/index.ts'

import ColumnMenu from '../components/general/ColumnMenu.vue'
import DateTimeSlider from '../components/general/DateTimeSlider.vue'
import SsdComponent from '../components/ssd/SsdComponent.vue'

interface Props {
  groupId?: string
  panelId?: string
}

interface SsdActionEventPayload {
  objectId: string
  panelId: string
  results: Result[]
}

const sliderDebounceInterval = 500

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
const alertsStore = useAlertsStore()
const route = useRoute()
const router = useRouter()

const props = withDefaults(defineProps<Props>(), {
  groupId: '',
  panelId: '',
})

const active = ref<string[]>([])
const open = ref<string[]>([])

const selectedDate = ref<Date>(new Date())
const selectedDateSlider = ref<Date>(selectedDate.value)

onMounted(() => {
  onGroupIdChange()
  onPanelIdChange()
})

const selectedDateString = computed(() => {
  const dateString = selectedDate.value.toISOString()
  return dateString.substring(0, 19) + 'Z'
})
const items = computed(() => {
  const result: ColumnItem[] = []
  if (capabilities.value !== undefined) {
    for (const displayGroup of capabilities.value.displayGroups) {
      // TODO: this should not be hard-coded in here, but should fixed in the configuration?
      const name = displayGroup.title.replace('Overzichtsschermen ', '')
      const children = []
      for (const displayPanel of displayGroup.displayPanels) {
        children.push({
          id: displayPanel.name,
          name: displayPanel.title,
          to: {
            name: 'SchematicStatusDisplay',
            params: {
              panelId: displayPanel.name,
              groupId: displayGroup.name,
            },
          },
        })
      }
      result.push({ id: displayGroup.name, name, children })
    }
  }
  return [{ id: 'root', name: 'Groups', children: result }]
})

// Debounce the selected date from the slider input, so we do not send hundreds of requests when
// dragging the slider around.
watch(
  selectedDateSlider,
  debounce(
    () => {
      selectedDate.value = selectedDateSlider.value
    },
    sliderDebounceInterval,
    { leading: true, trailing: true },
  ),
)
// Make sure the appropriate group in the menu is open, and the panel is selected.
watch(() => props.groupId, onGroupIdChange)
watch(() => props.panelId, onPanelIdChange)

const { capabilities, src, dates } = useSsd(
  baseUrl,
  () => props.groupId,
  () => props.panelId,
  selectedDateString,
)

// If the capabilities changes, make sure our currently selected groupId and panelId are still
// valid. If invalid or empty, select the first group and panel.
watch(capabilities, () => {
  let group: DisplayGroup | null = null
  let panel: DisplayPanel | null = null

  if (props.groupId !== '' && capabilities.value) {
    group =
      capabilities.value.displayGroups.find(
        (group) => group.name === props.groupId,
      ) ?? null
  }
  if (props.panelId !== '' && group) {
    panel =
      group.displayPanels.find((panel) => panel.name === props.panelId) ?? null
  }

  if (!group || !panel) {
    // Update the route with the first member of capabilities, but only if it exists.
    const newGroupId = capabilities.value?.displayGroups[0].name
    const newPanelId =
      capabilities.value?.displayGroups[0]?.displayPanels[0]?.name
    if (newGroupId && newPanelId) {
      router.push({
        name: 'SchematicStatusDisplay',
        params: { groupId: newGroupId, panelId: newPanelId },
        query: route.query,
      })
    }
  }
})

function onGroupIdChange(): void {
  open.value[1] = props.groupId
}

function onPanelIdChange(): void {
  active.value = [props.panelId]
}

function onAction(event: CustomEvent<SsdActionEventPayload>): void {
  const { results } = event.detail

  const now = new Date()
  if (results.length === 0) {
    alertsStore.addAlert(
      `undefined-action-${now.toISOString()}`,
      'No left click actions defined for this object',
    )
    return
  }

  switch (results[0].type) {
    case ActionType.URL:
    case ActionType.PDF:
      window.open(new URL(results[0].requests[0].request))
      break
    case ActionType.SSD:
      switchPanel(results[0].requests[0])
      break
    // TODO: implement once time series display works.
    case ActionType.PI:
    default:
      alertsStore.addAlert(
        `action-${results[0].type}-${now.toISOString()}`,
        `Action '${results[0].type}' not supported yet.`,
      )
  }
}

function switchPanel(request: ResultRequest): void {
  if (!capabilities.value) return

  // We want to use the URL web API to parse the query parameters of the relative URL specified in
  // the request; we are not actually using it as a URL. Hence, we use a random base URL.
  const url = new URL(request.request, 'https://www.example.com')
  const panelId = url.searchParams.get('ssd')

  if (!panelId) return

  // Find the display group that contains this panel.
  const group = capabilities.value.displayGroups.find((cur) => {
    return cur.displayPanels.some((panel) => panel.name === panelId)
  })
  const groupId = group?.name

  if (!groupId) return

  router.push({
    name: 'SchematicStatusDisplay',
    params: { groupId, panelId },
    query: route.query,
  })
}
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
}
</style>
