<template>
  <v-dialog
    v-model="open"
    :fullscreen="mobile"
    :max-width="mobile ? undefined : 1200"
    :height="mobile ? undefined : 'calc(100dvh - 48px)'"
    role="dialog"
  >
    <v-card class="capture-card">
      <v-card-title>{{ t('dynamicReport.screenshotTitle') }}</v-card-title>
      <v-card-text class="capture-content">
        <p class="mb-3">{{ t('dynamicReport.screenshotInstructions') }}</p>
        <v-autocomplete
          v-model="selectedNodeId"
          :items="nodes"
          item-title="name"
          item-value="id"
          :label="t('dynamicReport.selectNode')"
          density="compact"
          variant="solo-filled"
          flat
          hide-details
        />
        <div class="d-flex ga-2 mt-2">
          <v-select
            v-model="aspectRatio"
            :items="aspectRatioPresets"
            :label="t('dynamicReport.screenshotAspectRatio')"
            :disabled="busy"
            density="compact"
            variant="solo-filled"
            flat
            hide-details
          />
          <v-select
            v-model="screenshotWidth"
            :items="sizePresets"
            :label="t('dynamicReport.screenshotSize')"
            :disabled="busy"
            density="compact"
            variant="solo-filled"
            flat
            hide-details
          />
        </div>
        <v-alert
          v-if="error"
          type="error"
          density="compact"
          variant="tonal"
          class="mt-2"
          >{{ error }}</v-alert
        >
        <div ref="previewArea" class="preview-area mt-2">
          <div
            v-if="selectedNode && layerName !== undefined"
            ref="preview"
            class="preview preview-fixed-ratio"
            :style="{
              aspectRatio,
              '--preview-aspect-ratio': aspectRatio,
              '--preview-max-height': `${previewAreaHeight}px`,
            }"
          >
            <SpatialDisplay
              ref="spatialDisplay"
              :key="selectedNode.id"
              :topology-node="selectedNode"
              :layer-name="layerName"
              :settings="settings"
              independent-context
              @navigate="onNavigate"
            >
              <template #map>
                <MapCaptureTarget @change="map = $event" />
              </template>
            </SpatialDisplay>
          </div>
        </div>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn density="compact" variant="tonal" @click="open = false">{{
          t('common.cancel')
        }}</v-btn>
        <v-btn
          color="primary"
          density="compact"
          variant="tonal"
          prepend-icon="mdi-camera"
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
import { computed, nextTick, ref, shallowRef, useTemplateRef, watch } from 'vue'
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
import { useElementSize } from '@vueuse/core'
import { useDisplay } from 'vuetify'

interface Props {
  settings: ComponentSettings
  initialNodeId?: string
}
const props = defineProps<Props>()
const open = defineModel<boolean>({ required: true })
const emit = defineEmits<{
  capture: [image: Blob, label: string, caption: string]
}>()
const { t } = useI18n()
const { mobile } = useDisplay()
const store = useTopologyNodesStore()
const preview = useTemplateRef<HTMLDivElement>('preview')
const previewArea = useTemplateRef<HTMLDivElement>('previewArea')
const { height: previewAreaHeight } = useElementSize(previewArea)
const spatialDisplay =
  useTemplateRef<InstanceType<typeof SpatialDisplay>>('spatialDisplay')
const selectedNodeId = ref<string>()
const map = shallowRef<Map>()
const layerName = ref<string>()
const busy = ref(false)
const error = ref('')
const screenshotWidth = ref(1920)
const aspectRatio = ref(16 / 9)
const aspectRatioPresets = computed(() => [
  { title: '16:9', value: 16 / 9 },
  { title: '4:3', value: 4 / 3 },
  { title: '1:1', value: 1 },
  { title: '3:4', value: 3 / 4 },
])
const sizePresets = computed(() => {
  const ratio = aspectRatio.value
  return [
    { key: 'screenshotSizeSmall', width: 640 },
    { key: 'screenshotSizeMedium', width: 1280 },
    { key: 'screenshotSizeLarge', width: 1920 },
  ].map(({ key, width }) => ({
    title: t(`dynamicReport.${key}`, {
      size: `${width} × ${Math.round(width / ratio)}`,
    }),
    value: width,
  }))
})

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
watch(aspectRatio, async () => {
  selectionVersion++
  await nextTick()
  map.value?.resize()
})
watch(
  [selectedNode, open],
  async ([node, isOpen]) => {
    const version = ++selectionVersion
    map.value = undefined
    layerName.value = undefined
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
}

async function capture() {
  const currentMap = map.value
  const node = selectedNode.value
  if (!currentMap || !node) return
  const version = selectionVersion
  const selectedWidth = screenshotWidth.value
  busy.value = true
  error.value = ''
  try {
    const context = spatialDisplay.value?.getScreenshotContext()
    if (!context) throw new Error('The screenshot data layer is not ready')
    const caption = t('dynamicReport.screenshotCaption', {
      node: node.name ?? node.id,
      source: context.source,
      validTime: context.validTime,
    })
    const image = await captureNodeScreenshot(currentMap, {
      legend:
        preview.value?.querySelector<HTMLElement>('.colourbar-container') ??
        undefined,
      width: selectedWidth,
    })
    if (version !== selectionVersion || currentMap !== map.value || !open.value)
      return
    const latestContext = spatialDisplay.value?.getScreenshotContext()
    if (
      latestContext?.source !== context.source ||
      latestContext?.validTime !== context.validTime
    )
      throw new Error(
        'The screenshot data layer or valid time changed during capture',
      )
    emit('capture', image, node.name ?? node.id, caption)
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
.capture-card {
  height: 100%;
}
.capture-content {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow-y: auto;
}
.capture-content > :not(.preview-area) {
  flex: 0 0 auto;
}
.preview-area {
  flex: 1 0 160px;
  min-height: 160px;
}
.preview {
  height: 100%;
  min-height: 0;
  margin-inline: auto;
}
.preview-fixed-ratio {
  height: auto;
  width: min(
    100%,
    calc(var(--preview-max-height) * var(--preview-aspect-ratio))
  );
}
</style>
