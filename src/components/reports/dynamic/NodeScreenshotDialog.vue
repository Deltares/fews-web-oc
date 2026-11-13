<template>
  <v-dialog v-model="open" max-width="1200" role="dialog">
    <v-card>
      <v-card-title>{{ t('dynamicReport.screenshotTitle') }}</v-card-title>
      <v-card-text>
        <p class="mb-3">{{ t('dynamicReport.screenshotInstructions') }}</p>
        <v-autocomplete
          v-model="selectedNodeId"
          :items="nodes"
          item-title="name"
          item-value="id"
          :label="t('dynamicReport.selectNode')"
          hide-details
        />
        <v-select
          v-model="maxDimension"
          :items="sizePresets"
          :label="t('dynamicReport.screenshotSize')"
          :disabled="busy"
          class="mt-2"
          hide-details
        />
        <v-alert v-if="error" type="error" class="mt-2">{{ error }}</v-alert>
        <div
          v-if="selectedNode && layerName !== undefined"
          ref="preview"
          class="preview mt-2"
        >
          <SpatialDisplay
            :key="selectedNode.id"
            :topology-node="selectedNode"
            :layer-name="layerName"
            :location-ids="locationIds"
            :latitude="latitude"
            :longitude="longitude"
            :settings="settings"
            @navigate="onNavigate"
          >
            <template #map>
              <MapCaptureTarget @change="map = $event" />
            </template>
          </SpatialDisplay>
        </div>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn @click="open = false">{{ t('common.cancel') }}</v-btn>
        <v-btn
          color="primary"
          :disabled="!map || busy"
          :loading="busy"
          @click="capture"
          >{{ t('dynamicReport.addScreenshot') }}</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, ref, shallowRef, useTemplateRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { TopologyNode } from '@deltares/fews-pi-requests'
import type { Map } from 'maplibre-gl'
import type { ComponentSettings } from '@/lib/topology/componentSettings'
import { nodeHasMap } from '@/lib/topology/nodes'
import { getLayerNameForNode } from '@/lib/topology/displayTabs'
import { captureNodeScreenshot } from '@/lib/dynamic-report/screenshot'
import { useTopologyNodesStore } from '@/stores/topologyNodes'
import SpatialDisplay from '@/components/spatialdisplay/SpatialDisplay.vue'
import MapCaptureTarget from '@/components/map/MapCaptureTarget.vue'
import type { NavigateRoute } from '@/lib/router'
import { fetchAndInlineCssAndFonts } from '@/lib/css/inline'
import { useConfigStore } from '@/stores/config'

interface Props {
  settings: ComponentSettings
  initialNodeId?: string
}
const props = defineProps<Props>()
const open = defineModel<boolean>({ required: true })
const emit = defineEmits<{
  capture: [image: Blob, label: string]
}>()
const { t } = useI18n()
const store = useTopologyNodesStore()
const configStore = useConfigStore()
const preview = useTemplateRef<HTMLDivElement>('preview')
const selectedNodeId = ref<string>()
const map = shallowRef<Map>()
const layerName = ref<string>()
const busy = ref(false)
const error = ref('')
const locationIds = ref<string>()
const latitude = ref<string>()
const longitude = ref<string>()
const maxDimension = ref(1280)
const sizePresets = computed(() => [
  { title: t('dynamicReport.screenshotSizeSmall'), value: 640 },
  { title: t('dynamicReport.screenshotSizeMedium'), value: 1280 },
  { title: t('dynamicReport.screenshotSizeLarge'), value: 1920 },
])

const nodes = computed(() => {
  const result: TopologyNode[] = []
  function collect(items: TopologyNode[]) {
    for (const node of items) {
      if (nodeHasMap(node)) result.push(node)
      if (node.topologyNodes) collect(node.topologyNodes)
    }
  }
  collect(store.nodes)
  return result
})
const selectedNode = computed(() =>
  nodes.value.find((node) => node.id === selectedNodeId.value),
)

watch(open, (isOpen) => {
  if (!isOpen) {
    map.value = undefined
    layerName.value = undefined
    return
  }
  error.value = ''
  selectedNodeId.value = nodes.value.some(
    (node) => node.id === props.initialNodeId,
  )
    ? props.initialNodeId
    : nodes.value[0]?.id
})

let selectionVersion = 0
watch(
  [selectedNode, open],
  async ([node, isOpen]) => {
    const version = ++selectionVersion
    map.value = undefined
    layerName.value = undefined
    locationIds.value = undefined
    latitude.value = undefined
    longitude.value = undefined
    error.value = ''
    if (!node || !isOpen) return
    try {
      const layer = await getLayerNameForNode(node)
      if (version === selectionVersion) layerName.value = layer
    } catch (cause) {
      if (version !== selectionVersion) return
      console.error('Failed to load the screenshot node map', cause)
      error.value = t('dynamicReport.screenshotMapFailed')
    }
  },
  { flush: 'sync' },
)

function onNavigate(route: NavigateRoute) {
  selectionVersion++
  const params = route.params
  if (typeof params?.layerName === 'string') layerName.value = params.layerName
  locationIds.value =
    typeof params?.locationIds === 'string' ? params.locationIds : undefined
  latitude.value =
    typeof params?.latitude === 'string' ? params.latitude : undefined
  longitude.value =
    typeof params?.longitude === 'string' ? params.longitude : undefined
}

async function capture() {
  const currentMap = map.value
  const node = selectedNode.value
  if (!currentMap || !node) return
  const version = selectionVersion
  const selectedMaxDimension = maxDimension.value
  busy.value = true
  error.value = ''
  try {
    const wantsChart = !!(
      locationIds.value ||
      (latitude.value && longitude.value)
    )
    const svg = preview.value?.querySelector<SVGSVGElement>(
      '.chart-container svg',
    )
    if (wantsChart && !svg) throw new Error('The selected chart is not ready')
    let chart
    if (wantsChart && svg) {
      const bounds = svg.getBoundingClientRect()
      const css = await fetchAndInlineCssAndFonts(
        await configStore.getCustomStyleSheet(),
      )
      chart = { svg, css, width: bounds.width, height: bounds.height }
    }
    const image = await captureNodeScreenshot(currentMap, {
      chart,
      legend:
        preview.value?.querySelector<HTMLElement>('.colourbar-container') ??
        undefined,
      maxDimension: selectedMaxDimension,
    })
    if (version !== selectionVersion || currentMap !== map.value || !open.value)
      return
    emit('capture', image, node.name ?? node.id)
    open.value = false
  } catch (cause) {
    console.error('Failed to capture node screenshot', cause)
    if (version === selectionVersion && open.value) {
      error.value = t('dynamicReport.screenshotCaptureFailed')
    }
  } finally {
    busy.value = false
  }
}
</script>

<style scoped>
.preview {
  height: min(60vh, 600px);
  min-height: 300px;
}
.preview :deep(.map-container.has-chart) {
  display: flex;
}
</style>
