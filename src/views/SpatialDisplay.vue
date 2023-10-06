<template>
  <Teleport to="#web-oc-sidebar-target">
    <ColumnMenu :active.sync="active" :items="items" :open.sync="open">
    </ColumnMenu>
  </Teleport>
  <div class="container">
    <MapComponent>
      <animated-mapbox-layer :layer="layerOptions" />
    </MapComponent>
    <div class="colourbar">
      <ColourBar :colourMap="legend" />
    </div>
    <DateTimeSlider
      v-model:selectedDate="currentTime"
      :dates="times ?? []"
      @update:doFollowNow="setCurrentTime"
      @update:selectedDate="updateTime"
    />
  </div>
</template>

<script setup lang="ts">
import MapComponent from '../components/map/MapComponent.vue'
import ColumnMenu from '../components/general/ColumnMenu.vue'
import { ref, computed, onBeforeMount, watch } from 'vue'
import { ColumnItem } from '../components/general/ColumnItem'
import {
  convertBoundingBoxToLngLatBounds,
  useWmsLayer,
  useWmsCapilities,
} from '@/services/useWms'
import { configManager } from '@/services/application-config'
import { LngLatBounds } from 'mapbox-gl'
import { Layer, LayerGroup } from '@deltares/fews-wms-requests'
import ColourBar from '@/components/wms/ColourBar.vue'
import AnimatedMapboxLayer, {
  MapboxLayerOptions,
} from '@/components/wms/AnimatedMapboxLayer.vue'
import DateTimeSlider from '@/components/general/DateTimeSlider.vue'
import { DateController } from '@/lib/TimeControl/DateController.ts'
import debounce from 'lodash-es/debounce'

interface Props {
  layerName?: string
}

const props = withDefaults(defineProps<Props>(), {
  layerName: '',
})

onBeforeMount(() => {
  debouncedSetLayerOptions = debounce(setLayerOptions, 500, {
    leading: true,
    trailing: true,
  })
})

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
const dateController = new DateController([])
const { legendGraphic, times } = useWmsLayer(baseUrl, () => props.layerName)
const layersBbox: { [key: string]: LngLatBounds } = {}
const currentTime = ref<Date>(new Date())
const active = ref<string[]>(['root'])
const open = ref<string[]>([])
const layerOptions = ref<MapboxLayerOptions>()
const capabilities = useWmsCapilities(baseUrl)
let debouncedSetLayerOptions!: () => void
const items = ref<ColumnItem[]>()

const legend = computed(() => {
  return legendGraphic.value?.legend
})

watch(times, () => {
  const timesValue = times.value
  if (timesValue) {
    times.value = timesValue
    dateController.dates = timesValue
    dateController.selectDate(currentTime.value)
    currentTime.value = dateController.currentTime
  }
  setLayerOptions()
})

watch(capabilities, () => {
  if (capabilities.value === undefined) return []
  const layers = capabilities.value?.layers
  const groups = capabilities.value?.groups

  if (layers === undefined) return []
  if (groups === undefined) return []
  loadLayersBbox(layers)
  items.value = fillMenuItems(layers, groups)
})

function setCurrentTime(enabled: boolean): void {
  if (enabled) {
    dateController.selectDate(new Date())
    currentTime.value = dateController.currentTime
    setLayerOptions()
  }
}

function setLayerOptions(): void {
  if (props.layerName) {
    layerOptions.value = {
      name: props.layerName,
      time: currentTime.value,
      bbox: layersBbox[props.layerName],
    }
  }
}

function updateTime(date: Date): void {
  if (dateController.currentTime.getTime() === date.getTime()) return
  dateController.selectDate(date)
  currentTime.value = dateController.currentTime
  debouncedSetLayerOptions()
}

function fillMenuItems(layers: Layer[], groups: LayerGroup[]): ColumnItem[] {
  let groupNodesMenuItemsMap = determineGroupNodesMap(groups)
  const newItems = buildMenuFromGroups(groups, groupNodesMenuItemsMap)
  attachLayersToMenu(layers, groupNodesMenuItemsMap)
  return [{ id: 'root', name: 'Groups', children: newItems }]
}

function buildMenuFromGroups(
  groups: LayerGroup[],
  groupNodes: Map<string, ColumnItem>,
): ColumnItem[] {
  const items: ColumnItem[] = []
  for (const group of groups) {
    const groupNode = groupNodes.get(group.path.toString())
    if (group.groupName === undefined && groupNode !== undefined) {
      items.push(groupNode)
    } else {
      if (
        groupNode !== undefined &&
        group.groupName !== undefined &&
        group.path.length > 0
      ) {
        const parentPath = group.path.slice(0, -1)
        if (parentPath !== undefined) {
          const parentNode = groupNodes.get(parentPath.toString())
          parentNode?.children?.push(groupNode)
        }
      }
    }
  }
  return items
}

function determineGroupNodesMap(groups: LayerGroup[]): Map<string, ColumnItem> {
  let groupNodes = new Map<string, ColumnItem>()
  for (const group of groups) {
    const item: ColumnItem = {
      id: group.path.toString(),
      name: group.title,
      children: [],
    }
    groupNodes.set(group.path.toString(), item)
  }
  return groupNodes
}

function attachLayersToMenu(
  layers: Layer[],
  groupNodes: Map<string, ColumnItem>,
) {
  for (const layer of layers) {
    const groupNode = groupNodes.get(layer.path.toString())
    const item: ColumnItem = {
      id: layer.name,
      name: layer.title || layer.name,
      to: {
        name: 'SpatialDisplay',
        params: {
          layerName: layer.name,
        },
      },
    }
    groupNode?.children?.push(item)
  }
}

function loadLayersBbox(layers: Layer[]): void {
  for (const layer of layers) {
    if (layer.boundingBox) {
      layersBbox[layer.name] = convertBoundingBoxToLngLatBounds(
        layer.boundingBox,
      )
    }
  }
}
</script>

<style scoped>
.colourbar {
  font-size: 0.825em;
  z-index: 1000;
  background-color: none;
  position: absolute;
  bottom: 80px;
}

.container {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
}
</style>
