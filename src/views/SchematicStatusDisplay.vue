<template>
  <Teleport to="#web-oc-sidebar-target">
    <ColumnMenu :active.sync="active" :items="items" :open.sync="open" />
  </Teleport>
  <div class="container">
    <SsdComponent :src="src" @action="onAction" />
    <DateTimeSlider
      v-model:selectedDate="selectedDate"
      v-model:doFollowNow="doFollowNow"
      :dates="dates"
    />
  </div>
</template>

<script setup lang="ts">
import { ActionType, Result, ResultRequest } from '@deltares/fews-ssd-requests'
import { ref, onMounted, computed } from 'vue'
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

const selectedDate = ref(new Date())
const doFollowNow = ref(false)

onMounted(() => {
  active.value = ['root']
})

const selectedDateString = computed(() => {
  const dateString = selectedDate.value.toISOString()
  return dateString.substring(0, 19) + 'Z'
})
const items = computed(() => {
  const result: ColumnItem[] = []
  if (capabilities.value !== undefined) {
    for (const displayGroup of capabilities.value.displayGroups) {
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

const { capabilities, src, dates } = useSsd(
  baseUrl,
  () => props.groupId,
  () => props.panelId,
  selectedDateString,
)

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
