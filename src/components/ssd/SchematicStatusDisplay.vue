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
        :mobile="mobile"
        :allowZooming="settings.ssd.zoomEnabled"
        @action="onAction"
        ref="ssdComponent"
      />
      <DateTimeSlider
        v-if="dateTimeSliderEnabled"
        v-model:selectedDate="selectedDateOfSlider"
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
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAlertsStore } from '@/stores/alerts.ts'
import { configManager } from '@/services/application-config/index.ts'
import { useSsd } from '@/services/useSsd/index.ts'
import DateTimeSlider from '@/components/general/DateTimeSlider.vue'
import SsdComponent from '@/components/ssd/SsdComponent.vue'
import { useDisplay } from 'vuetify'
import { debouncedRef, useElementSize } from '@vueuse/core'
import {
  getDefaultSettings,
  type ComponentSettings,
} from '@/lib/topology/componentSettings'
import { useDateRegistry } from '@/services/useDateRegistry'
import { useSelectedDate } from '@/services/useSelectedDate'

interface Props {
  groupId?: string
  panelId?: string
  objectId?: string
  settings?: ComponentSettings
}

const props = withDefaults(defineProps<Props>(), {
  groupId: '',
  panelId: '',
  objectId: '',
  settings: () => getDefaultSettings(),
})

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

const ssdComponent = ref<InstanceType<typeof SsdComponent> | null>(null)
const ssdContainer = ref<HTMLElement | null>(null)

const selectedDateOfSlider = ref<Date>(new Date())
const { selectedDate, dateTimeSliderEnabled } =
  useSelectedDate(selectedDateOfSlider)

const selectedDateString = computed(() => {
  if (selectedDate.value === undefined) return ''
  const dateString = selectedDate.value.toISOString()
  return dateString.substring(0, 19) + 'Z'
})

// Debounce the selected date string from the slider input,
// so we do not send hundreds of requests when dragging the slider around.
const debouncedDateString = debouncedRef(
  selectedDateString,
  sliderDebounceInterval,
)

const { capabilities, src, dates } = useSsd(
  baseUrl,
  () => props.panelId,
  debouncedDateString,
)

useDateRegistry(dates)

const hideSSD = computed(() => {
  return mobile.value && props.objectId !== ''
})

const { width: containerWidth } = useElementSize(ssdContainer)
watch(containerWidth, () => {
  ssdComponent.value?.resize()
})

const { thresholds, mobileBreakpoint } = useDisplay()
const mobile = computed(() => {
  const breakpoint = mobileBreakpoint.value
  if (typeof breakpoint === 'number') {
    return containerWidth.value < breakpoint
  } else {
    return containerWidth.value < thresholds.value[breakpoint]
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
