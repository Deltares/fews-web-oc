<template>
  <div class="container" ref="container">
    <div
      class="child-container flex-column"
      :class="{ 'd-none': hideMap, 'd-flex': !hideMap }"
    >
      <SpatialDisplayComponent
        :layer-name="props.layerName"
        :location-ids="props.locationIds"
        :latitude="props.latitude"
        :longitude="props.longitude"
        :group-id="groupId"
        v-model:task-run-id="taskRunId"
        :locations="filteredLocations"
        :geojson="filteredGeojson"
        @changeLocationIds="onLocationsChange"
        @changeLayer="onLayerChange"
        :layer-capabilities="layerCapabilities"
        :bounding-box="boundingBox"
        :times="times"
        :settings="settings.map"
        v-model:elevation="elevation"
        @update:current-time="currentTime = $event"
        @coordinate-click="onCoordinateClick"
      ></SpatialDisplayComponent>
    </div>
    <div v-if="showChartPanel" class="child-container flex-column d-flex">
      <SpatialTimeSeriesDisplay
        :layerName="layerName"
        :locationIds="locationIds"
        :latitude="latitude"
        :longitude="longitude"
        :topologyNode="topologyNode"
        :settings="settings"
        :currentTime="currentTime"
        :elevation="elevation"
      >
        <template #toolbar-append>
          <v-btn
            v-if="!containerIsMobileSize"
            size="small"
            :icon="maximized ? 'mdi-fullscreen-exit' : 'mdi-fullscreen'"
            @click="maximized = !maximized"
          />
          <v-btn
            size="small"
            icon="mdi-close"
            @click="closeTimeSeriesDisplay"
          />
        </template>
      </SpatialTimeSeriesDisplay>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, ref, useTemplateRef, watch } from 'vue'
import SpatialDisplayComponent from '@/components/spatialdisplay/SpatialDisplayComponent.vue'
import { useDisplay } from 'vuetify'
import { configManager } from '@/services/application-config'
import { useWmsLayerCapabilities } from '@/services/useWms'
import { type TopologyNode } from '@deltares/fews-pi-requests'
import { useUserSettingsStore } from '@/stores/userSettings'
import { useFilterLocations } from '@/services/useFilterLocations'
import {
  type ComponentSettings,
  getDefaultSettings,
} from '@/lib/topology/componentSettings'
import { useElementSize } from '@vueuse/core'
import { useDateRegistry } from '@/services/useDateRegistry'
import type { NavigateRoute } from '@/lib/router'
import { useWarningLevelsStore } from '@/stores/warningLevels'
import { useLocationNamesStore } from '@/stores/locationNames'
import { useTaskRunsStore } from '@/stores/taskRuns'
import { refreshTaskRuns } from '@/services/useTasksRuns'
import {
  filterFeaturesByThresholds,
  filterLocationsByThresholds,
} from '@/lib/thresholds/utils'

const SpatialTimeSeriesDisplay = defineAsyncComponent(
  () => import('@/components/spatialdisplay/SpatialTimeSeriesDisplay.vue'),
)

interface Props {
  layerName?: string
  locationIds?: string
  latitude?: string
  longitude?: string
  topologyNode?: TopologyNode
  settings?: ComponentSettings
}

const props = withDefaults(defineProps<Props>(), {
  layerName: '',
  settings: () => getDefaultSettings(),
})

interface Emits {
  navigate: [to: NavigateRoute]
}
const emit = defineEmits<Emits>()

const taskRunId = ref<string>()
const taskRunsStore = useTaskRunsStore()
watch(
  [() => props.layerName, () => props.topologyNode],
  ([newLayerName, newTopologyNode], [_, oldTopologyNode]) => {
    const topologyNodeChanged = newTopologyNode?.id !== oldTopologyNode?.id
    if (topologyNodeChanged) {
      refreshTaskRuns()
      return
    }
    const taskRun = taskRunsStore.getTaskRunById(taskRunId.value)
    const layerIds = taskRun?.topologyAssociations?.layerIds ?? []
    if (!newLayerName || !layerIds.includes(newLayerName)) {
      taskRunId.value = undefined
    }
  },
)

watch(
  () => [taskRunsStore.currentTaskRuns, taskRunsStore.selectedTaskRuns],
  () => {
    if (!taskRunId.value) return
    if (!taskRunsStore.getTaskRunById(taskRunId.value)) {
      taskRunId.value = undefined
    }
  },
)

const warningLevelsStore = useWarningLevelsStore()
const locationNamesStore = useLocationNamesStore()
const userSettings = useUserSettingsStore()

const { thresholds } = useDisplay()
const containerRef = useTemplateRef('container')

const boundingBox = computed(() => props.topologyNode?.boundingBox)
const filterIds = computed(() => props.topologyNode?.filterIds ?? [])
const filterOptions = computed(() => {
  if (userSettings.get('ui.map.showDataAvailability')?.value === true) {
    return {
      showTimeSeriesInfo: true,
    }
  }
  return {}
})

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
const { layerCapabilities, times } = useWmsLayerCapabilities(
  baseUrl,
  () => props.layerName,
  taskRunId,
)

const groupId = computed(
  () => props.topologyNode?.gridDisplaySelection?.groupId,
)

const { locations, geojson } = useFilterLocations(
  baseUrl,
  filterIds,
  filterOptions,
)
watch(locations, (newLocations) =>
  locationNamesStore.addLocationNames(newLocations ?? []),
)

const selectedCrossings = computed(() => {
  if (warningLevelsStore.selectedWarningLevelIds.length === 0) return []
  return warningLevelsStore.selectedThresholdCrossings
    .sort((a, b) => b.severity - a.severity)
    .filter(
      (crossing, index, self) =>
        index === self.findIndex((c) => c.locationId === crossing.locationId),
    )
})
const selectedSeverities = computed(() =>
  warningLevelsStore.selectedWarningLevels.map((level) => level.severity),
)
const filteredLocations = computed(() => {
  if (warningLevelsStore.selectedWarningLevelIds.length === 0) {
    return locations.value
  }
  return filterLocationsByThresholds(
    locations.value,
    selectedSeverities.value,
    selectedCrossings.value,
  )
})
const filteredGeojson = computed(() => {
  if (warningLevelsStore.selectedWarningLevelIds.length === 0) {
    return geojson.value
  }
  return {
    ...geojson.value,
    ...{
      features: filterFeaturesByThresholds(
        geojson.value.features,
        selectedSeverities.value,
        selectedCrossings.value,
      ),
    },
  }
})

useDateRegistry(() => times.value ?? [])

const onlyCoverageLayersAvailable = computed(() => {
  const capabilities = layerCapabilities.value
  if (!capabilities) return false
  return capabilities.onlyGrids ?? true
})

const showChartPanel = computed(() => {
  return props.locationIds || (props.longitude && props.latitude)
})

const elevation = ref<number | undefined>()
const currentTime = ref<Date>()
const maximized = ref(false)

const { width: containerWidth } = useElementSize(containerRef)

const containerIsMobileSize = computed(() => {
  return containerWidth.value < thresholds.value.md
})

const hideMap = computed(() => {
  return (
    maximized.value || (containerIsMobileSize.value && showChartPanel.value)
  )
})

function onLocationsChange(locationIds: string[]): void {
  if (locationIds.length) {
    openLocationsTimeSeriesDisplay(locationIds)
  } else if (props.longitude && props.latitude) {
    // Opening a coordinates display so do not close time series display
    return
  } else {
    closeTimeSeriesDisplay()
  }
}

function onLayerChange(layerName: string): void {
  if (props.locationIds) {
    emit('navigate', {
      name: 'SpatialDisplayWithLocation',
      params: { layerName, locationIds: props.locationIds },
    })
    return
  }

  if (props.longitude && props.latitude) {
    emit('navigate', {
      name: 'SpatialDisplayWithCoordinates',
      params: {
        layerName,
        latitude: props.latitude,
        longitude: props.longitude,
      },
    })
    return
  }

  emit('navigate', {
    name: 'SpatialDisplay',
    params: {
      layerName,
    },
  })
}

function openLocationsTimeSeriesDisplay(locationIds: string[]) {
  const to = {
    name: 'SpatialDisplayWithLocation',
    params: { locationIds: locationIds.join(',') },
  }
  emit('navigate', to)
}

function onCoordinateClick(latitude: number, longitude: number): void {
  openCoordinatesTimeSeriesDisplay(latitude, longitude)
}

function openCoordinatesTimeSeriesDisplay(latitude: number, longitude: number) {
  if (!onlyCoverageLayersAvailable.value) return

  const _latitude = latitude.toFixed(3)
  const _longitude = longitude.toFixed(3)

  const to = {
    name: 'SpatialDisplayWithCoordinates',
    params: {
      latitude: _latitude,
      longitude: _longitude,
    },
  }
  emit('navigate', to)
}

function closeTimeSeriesDisplay(): void {
  maximized.value = false
  emit('navigate', { name: 'SpatialDisplay' })
}

watch(locations, () => {
  if (
    props.locationIds
      ?.split(',')
      .some((id) => !locations.value?.map((l) => l.locationId).includes(id))
  ) {
    closeTimeSeriesDisplay()
  }
})

watch(
  () => onlyCoverageLayersAvailable.value,
  (onlyCoverage) => {
    if (!onlyCoverage && props.longitude && props.latitude) {
      closeTimeSeriesDisplay()
    }
  },
)
</script>

<style scoped>
.container {
  display: flex;
  width: 100%;
  height: 100%;
}

.child-container {
  position: relative;
  width: 50%;
  max-width: 100%;
  flex: 1 1 0px;
}

.child-container.mobile {
  height: 100%;
  width: 100%;
}
</style>
