<template>
  <Teleport to="#web-oc-sidebar-target">
    <v-toolbar v-if="!mobile" density="compact">
      <v-btn-toggle
        v-model="menuType"
        variant="tonal"
        divided
        density="compact"
        class="ma-2"
      >
        <v-btn variant="text" value="treemenu">
          <v-icon>mdi-file-tree</v-icon>
        </v-btn>
        <v-btn variant="text" value="columnmenu">
          <v-icon>mdi-view-week</v-icon>
        </v-btn>
      </v-btn-toggle>
    </v-toolbar>
    <TreeMenu
      v-if="menuType === 'treemenu' && !mobile"
      v-model:active="active"
      :items="items"
      :open="open"
    >
    </TreeMenu>
    <ColumnMenu
      v-else-if="menuType === 'columnmenu' || mobile"
      v-model:active="active"
      :items="items"
      v-model:open="open"
    >
    </ColumnMenu>
  </Teleport>
  <div class="container">
    <div
      class="child-container"
      :class="{ 'd-none': hideSSD }"
      ref="ssdContainer"
    >
      <SsdComponent :src="src" @action="onAction" ref="ssdComponent" />
      <DateTimeSlider
        v-model:selectedDate="selectedDateSlider"
        :dates="dates"
      />
    </div>
    <div class="child-container" :class="{ mobile, 'd-none': objectId === '' }">
      <router-view @close="closeTimeSeriesDisplay"></router-view>
    </div>
  </div>
</template>

<script setup lang="ts">
import type {
  SsdActionResult,
  SsdDisplayGroup,
  SsdDisplayPanel,
  SsdActionRequest,
} from '@deltares/fews-ssd-requests'
import debounce from 'lodash-es/debounce'
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { useAlertsStore } from '../stores/alerts.ts'

import { configManager } from '../services/application-config/index.ts'
import type { ColumnItem } from '../components/general/ColumnItem'

import { useSsd } from '../services/useSsd/index.ts'

import ColumnMenu from '../components/general/ColumnMenu.vue'
import TreeMenu from '@/components/general/TreeMenu.vue'
import DateTimeSlider from '../components/general/DateTimeSlider.vue'
import SsdComponent from '../components/ssd/SsdComponent.vue'
import { useDisplay } from 'vuetify'
import { useElementSize } from '@vueuse/core'

interface Props {
  groupId?: string
  panelId?: string
  objectId?: string
}

interface SsdActionEventPayload {
  objectId: string
  panelId: string
  results: SsdActionResult[]
}

const sliderDebounceInterval = 500

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
const alertsStore = useAlertsStore()
const route = useRoute()
const router = useRouter()

const props = withDefaults(defineProps<Props>(), {
  groupId: '',
  panelId: '',
  objectId: '',
})

const ssdComponent = ref<InstanceType<typeof SsdComponent> | null>(null)
const ssdContainer = ref<HTMLElement | null>(null)

const active = ref<string[]>([])
const open = ref<string[]>([])

const selectedDate = ref<Date>(new Date())
const selectedDateSlider = ref<Date>(selectedDate.value)

const { mobile } = useDisplay()
const menuType = ref('treemenu')

onMounted(() => {
  onGroupIdChange()
  onPanelIdChange()
})

const selectedDateString = computed(() => {
  if (selectedDate.value === undefined) return ''
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
  return result
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
  let group: SsdDisplayGroup | null = null
  let panel: SsdDisplayPanel | null = null

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

const hideSSD = computed(() => {
  return mobile.value && props.objectId !== ''
})

const ssdContainerSize = useElementSize(ssdContainer)
watch(ssdContainerSize.width, () => {
  if (ssdComponent.value) {
    ssdComponent.value.resize()
  }
})

function onAction(event: CustomEvent<SsdActionEventPayload>): void {
  const { panelId, objectId, results } = event.detail
  const now = new Date()
  if (results.length === 0) {
    alertsStore.addAlert(
      `undefined-action-${now.toISOString()}`,
      'No left click actions defined for this object',
    )
    return
  }

  switch (results[0].type) {
    case 'PDF':
      window.open(new URL(results[0].requests[0].request))
      break
    case 'SSD':
      switchPanel(results[0].requests[0])
      break
    case 'PI':
      openTimeSeriesDisplay(panelId, objectId)
      break
    default:
      alertsStore.addAlert(
        `action-${results[0].type}-${now.toISOString()}`,
        `Action '${results[0].type}' not supported yet.`,
      )
  }
}

function switchPanel(request: SsdActionRequest): void {
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

function openTimeSeriesDisplay(panelId: string, objectId: string) {
  router
    .push({
      name: 'SSDTimeSeriesDisplay',
      params: { objectId: objectId, panelId: panelId, groupId: props.groupId },
    })
    .then(() => {
      ssdComponent.value?.resize()
    })
}

function closeTimeSeriesDisplay(objectId: string): void {
  if (objectId) {
    router
      .push({
        name: 'SchematicStatusDisplay',
        params: { groupId: props.groupId, panelId: props.panelId },
      })
      .then(() => {
        ssdComponent.value?.resize()
      })
  }
}
</script>

<style scoped>
.container {
  display: flex;
  width: 100%;
  height: 100%;
}

.child-container {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 50%;
  max-width: 100%;
  flex: 1 1 0px;
}

.child-container.mobile {
  height: 100%;
  width: 100%;
}
</style>
