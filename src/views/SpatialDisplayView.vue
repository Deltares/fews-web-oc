<template>
  <Teleport to="#web-oc-sidebar-target">
    <HierarchicalMenu
      v-model:active="active"
      v-model:open="open"
      :type="menuType"
      :items="items"
    />
  </Teleport>
  <SpatialDisplay
    :layer-name="props.layerName"
    :latitude="props.latitude"
    :longitude="props.longitude"
    @navigate="onNavigate"
  />
</template>

<script setup lang="ts">
import HierarchicalMenu from '@/components/general/HierarchicalMenu.vue'
import { computed, ref, watch } from 'vue'
import { ColumnItem } from '../components/general/ColumnItem'
import { useWmsCapilities } from '@/services/useWms'
import { configManager } from '@/services/application-config'
import { Layer, LayerGroup } from '@deltares/fews-wms-requests'
import SpatialDisplay from '@/components/spatialdisplay/SpatialDisplay.vue'
import { useUserSettingsStore } from '@/stores/userSettings'
import { useRoute, useRouter } from 'vue-router'
import type { NavigateRoute } from '@/lib/router'

interface Props {
  layerName?: string
  latitude?: string
  longitude?: string
}

const props = withDefaults(defineProps<Props>(), {
  layerName: '',
})

const route = useRoute()
const router = useRouter()

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
const capabilities = useWmsCapilities(baseUrl)

const settings = useUserSettingsStore()

const active = ref<string>('root')
const open = ref<string[]>([])
const items = ref<ColumnItem[]>([])

const menuType = computed(() => {
  const configured = settings.get('ui.hierarchical-menu-style')?.value as string
  return configured ?? 'auto'
})

watch(capabilities, () => {
  if (capabilities.value === undefined) return []
  const layers = capabilities.value?.layers
  const groups = capabilities.value?.groups

  if (layers === undefined) return []
  if (groups === undefined) return []
  items.value = fillMenuItems(layers, groups)
})

function fillMenuItems(layers: Layer[], groups: LayerGroup[]): ColumnItem[] {
  let groupNodesMenuItemsMap = determineGroupNodesMap(groups)
  const newItems = buildMenuFromGroups(groups, groupNodesMenuItemsMap)
  attachLayersToMenu(layers, groupNodesMenuItemsMap)
  return newItems
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
    const groupNode =
      layer.path === undefined
        ? undefined
        : groupNodes.get(layer.path.toString())
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

function onNavigate(to: NavigateRoute) {
  switch (to.name) {
    case 'SpatialTimeSeriesDisplay':
      router.push({
        name: to.name,
        params: {
          layerName: props.layerName,
          locationIds: to.params?.locationIds,
        },
        query: route.query,
      })
      break
    case 'SpatialTimeSeriesDisplayWithCoordinates':
      router.push({
        name: to.name,
        params: {
          layerName: props.layerName,
          latitude: to.params?.latitude,
          longitude: to.params?.longitude,
        },
        query: route.query,
      })
      break
    case 'SpatialDisplay':
      router.push({
        name: to.name,
        params: {
          layerName: props.layerName,
        },
        query: route.query,
      })
      break
    default:
      console.warn(`Unknown route name: ${String(to.name)}`)
  }
}
</script>
