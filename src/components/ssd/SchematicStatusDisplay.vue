<template>
  <div class="container">
    <div
      class="child-container"
      :class="{ 'd-none': hideSSD }"
      ref="ssdContainer"
    >
      <SsdComponent
        :src="src"
        :key="panelId"
        :allowZooming="!disableZooming"
        @action="onAction"
        ref="ssdComponent"
      />
      <DateTimeSlider
        v-if="showDateTimeSlider"
        v-model:selectedDate="selectedDateSlider"
        :dates="dates"
        :hide-speed-controls="mobile"
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
  SsdActionRequest,
} from '@deltares/fews-ssd-requests'
import debounce from 'lodash-es/debounce'
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAlertsStore } from '@/stores/alerts.ts'
import { configManager } from '@/services/application-config/index.ts'
import { useSsd } from '@/services/useSsd/index.ts'
import DateTimeSlider from '@/components/general/DateTimeSlider.vue'
import SsdComponent from '@/components/ssd/SsdComponent.vue'
import { useDisplay } from 'vuetify'
import { useElementSize } from '@vueuse/core'
import type { SchematicStatusDisplaySettings } from '@/lib/topology/componentSettings'

interface Props {
  groupId?: string
  panelId?: string
  objectId?: string
  settings?: SchematicStatusDisplaySettings
}

interface SsdActionEventPayload {
  objectId: string
  panelId: string
  results: SsdActionResult[]
}

const disableZooming = computed(() => {
  return props.settings?.zoomingDisabled ?? true
})

const showDateTimeSlider = computed(() => {
  return props.settings?.dateTimeSliderEnabled ?? true
})

const sliderDebounceInterval = 500

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
const alertsStore = useAlertsStore()
const route = useRoute()
const router = useRouter()

const props = withDefaults(defineProps<Props>(), {
  groupId: '',
  panelId: '',
  objectId: '',
  showDateTimeSlider: true,
})

const ssdComponent = ref<InstanceType<typeof SsdComponent> | null>(null)
const ssdContainer = ref<HTMLElement | null>(null)

const selectedDate = ref<Date>(new Date())
const selectedDateSlider = ref<Date>(selectedDate.value)

const { mobile } = useDisplay()

const selectedDateString = computed(() => {
  if (selectedDate.value === undefined) return ''
  const dateString = selectedDate.value.toISOString()
  return dateString.substring(0, 19) + 'Z'
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

const { capabilities, src, dates } = useSsd(
  baseUrl,
  () => props.panelId,
  selectedDateString,
)

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
    alertsStore.addAlert({
      id: `undefined-action-${now.toISOString()}`,
      type: 'error',
      message: 'No left click actions defined for this object',
    })
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
      alertsStore.addAlert({
        id: `action-${results[0].type}-${now.toISOString()}`,
        type: 'error',
        message: `Action '${results[0].type}' not supported yet.`,
      })
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

  const currentRoute = router.currentRoute.value
  const parentRoute = router
    .getRoutes()
    .find(
      (route) =>
        route.children &&
        route.children.some((child) => child.name === currentRoute.name),
    )
  const targetRouteName = parentRoute?.name ?? currentRoute.name
  if (!targetRouteName) return
  router.push({
    name: targetRouteName,
    params: { groupId, panelId },
    query: route.query,
  })
}

function openTimeSeriesDisplay(panelId: string, objectId: string) {
  const currentRoute = router.currentRoute.value
  const routeConfig = router
    .getRoutes()
    .find((route) => route.name === currentRoute.name)
  const childRoute = routeConfig?.children?.find((route) =>
    route.name?.toString().endsWith('SSDTimeSeriesDisplay'),
  )
  router
    .push({
      name: childRoute?.name,
      params: { objectId: objectId, panelId: panelId, groupId: props.groupId },
    })
    .then(() => {
      ssdComponent.value?.resize()
    })
}

function closeTimeSeriesDisplay(): void {
  const currentRoute = router.currentRoute.value
  const parentRoute = router
    .getRoutes()
    .find(
      (route) =>
        route.children &&
        route.children.some((child) => child.name === currentRoute.name),
    )
  if (!parentRoute) return
  router
    .push({
      name: parentRoute.name,
      params: { groupId: props.groupId, panelId: props.panelId },
    })
    .then(() => {
      ssdComponent.value?.resize()
    })
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
