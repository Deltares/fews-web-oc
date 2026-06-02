<template>
  <SpatialTimeSeriesDisplayComponent
    :filter="filter"
    :brushFilter="brushFilter"
    :elevation-chart-filter="elevationChartFilter"
    :locations-tooltip-filter="locationsTooltipFilter"
    :current-time="currentTime"
    :settings="settings"
  >
    <template #toolbar-append>
      <slot name="toolbar-append" />
    </template>
  </SpatialTimeSeriesDisplayComponent>
</template>

<script setup lang="ts">
import SpatialTimeSeriesDisplayComponent from '@/components/spatialdisplay/SpatialTimeSeriesDisplayComponent.vue'
import { computed } from 'vue'
import { configManager } from '@/services/application-config'
import { useWmsLayerCapabilities } from '@/services/useWms'
import {
  FilterActionsFilter,
  LocationsTooltipFilter,
  TimeSeriesGridActionsFilter,
  type TopologyNode,
} from '@deltares/fews-pi-requests'
import { toMercator } from '@turf/projection'
import circle from '@turf/circle'
import bbox from '@turf/bbox'
import { useUserSettingsStore } from '@/stores/userSettings'
import {
  type ComponentSettings,
  getDefaultSettings,
} from '@/lib/topology/componentSettings'

interface Props {
  layerName?: string
  locationIds?: string
  latitude?: string
  longitude?: string
  topologyNode?: TopologyNode
  settings?: ComponentSettings
  currentTime?: Date
  elevation?: number
  taskRunId?: string
}

const props = withDefaults(defineProps<Props>(), {
  layerName: '',
  settings: () => getDefaultSettings(),
})

const userSettings = useUserSettingsStore()

const filterIds = computed(() => props.topologyNode?.filterIds ?? [])

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
const { layerCapabilities } = useWmsLayerCapabilities(
  baseUrl,
  () => props.layerName,
  undefined,
)

const currentTime = computed(() => {
  if (props.currentTime) {
    return props.currentTime
  }

  const lastValueTime = layerCapabilities.value?.lastValueTime
  if (!lastValueTime) return

  return new Date(lastValueTime)
})

function getFilterActionsFilter(
  locationIds: string,
  fullDataPeriod?: boolean,
): FilterActionsFilter {
  return {
    locationIds,
    filterId: filterIds.value ? filterIds.value[0] : undefined,
    useDisplayUnits: userSettings.useDisplayUnits,
    convertDatum: userSettings.convertDatum,
    fullDataPeriod,
  }
}

function getTimeSeriesGridActionsFilter(
  longitude: string,
  latitude: string,
): TimeSeriesGridActionsFilter | undefined {
  if (!longitude || !latitude) return
  if (!layerCapabilities.value?.boundingBox) return
  if (!layerCapabilities.value?.firstValueTime) return
  if (!layerCapabilities.value?.lastValueTime) return

  const coordinates = [+longitude, +latitude]
  const [x, y] = toMercator(coordinates)
  const clickRadius = circle(coordinates, 10, { steps: 4, units: 'kilometers' })
  const bboxArray = bbox(clickRadius)
  const mercatorBbox = [
    ...toMercator(bboxArray.slice(0, 2)),
    ...toMercator(bboxArray.slice(-2)),
  ]
  const startTime = layerCapabilities.value.firstValueTime
  const endTime = layerCapabilities.value.lastValueTime

  return {
    layers: props.layerName,
    x,
    y,
    startTime,
    endTime,
    bbox: mercatorBbox,
    documentFormat: 'PI_JSON',
    useDisplayUnits: userSettings.useDisplayUnits,
    taskRunId: props.taskRunId,
    // Should be available according to the docs, but errors
    // convertDatum: settings.convertDatum,
  }
}

const brushFilter = computed(() => {
  if (!userSettings.get('charts.brush')?.value) {
    return
  }
  if (props.locationIds) {
    return getFilterActionsFilter(props.locationIds, true)
  }
  if (props.longitude && props.latitude) {
    return getTimeSeriesGridActionsFilter(props.longitude, props.latitude)
  }
  return {}
})

const filter = computed(() => {
  if (props.locationIds) {
    return getFilterActionsFilter(props.locationIds)
  }

  if (props.longitude && props.latitude) {
    const actionsFilter = getTimeSeriesGridActionsFilter(
      props.longitude,
      props.latitude,
    )
    if (!actionsFilter) return {}

    return {
      ...actionsFilter,
      elevation:
        props.elevation ?? layerCapabilities.value?.elevation?.upperValue,
    }
  }

  return {}
})

const shouldFetchElevationChart = computed(
  () =>
    props.settings.charts.verticalProfileChart.enabled ||
    props.settings.charts.verticalProfileTable.enabled,
)

const elevationChartFilter = computed(() => {
  if (!shouldFetchElevationChart.value) return
  if (!layerCapabilities.value?.elevation) return

  if (props.longitude && props.latitude) {
    const actionsFilter = getTimeSeriesGridActionsFilter(
      props.longitude,
      props.latitude,
    )
    if (!actionsFilter) return

    return {
      ...actionsFilter,
      showVerticalProfile: true,
    }
  }
})

const shouldFetchLocationsTooltip = computed(
  () => props.settings.charts.metaDataPanel.enabled,
)

const locationsTooltipFilter = computed<LocationsTooltipFilter | undefined>(
  () => {
    if (!shouldFetchLocationsTooltip.value) return
    if (props.locationIds === undefined) return
    if (filterIds.value.length === 0) return
    return {
      locationId: props.locationIds?.split(',')[0],
      filterId: filterIds.value[0],
    }
  },
)
</script>
