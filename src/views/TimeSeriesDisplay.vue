<template>
  <Teleport to="#web-oc-sidebar-target">
    <ColumnMenu
      rootName="Topology"
      :active.sync="active"
      :items="items"
      :open.sync="open"
    >
    </ColumnMenu>
  </Teleport>
  <div style="dislay: flex; flex-direction: column; height: 100%">
    <v-toolbar density="compact">
      <v-spacer />
      <v-menu offset-y>
        <template v-slot:activator="{ props }">
          <v-btn class="text-capitalize" variant="text" v-bind="props"
            >{{ plotIds[selectedPlot] }}<v-icon>mdi-chevron-down</v-icon>
          </v-btn>
        </template>
        <v-list v-model="selectedPlot" density="compact">
          <v-list-item
            v-for="(plot, i) in plotIds"
            v-bind:key="i"
            @click="selectedPlot = i"
          >
            <v-list-item-title>{{ plot }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
      <v-spacer />
    </v-toolbar>
    <div style="flex: 1 1 100%">{{ sublots }}</div>
  </div>
</template>

<script setup lang="ts">
// import TimeSeriesChart from '../components/charts/TimeSeriesChart.vue'
import ColumnMenu from '../components/general/ColumnMenu.vue'
import { ref, onMounted, watch } from 'vue'
import { ColumnItem } from '../components/general/ColumnItem'
import { configManager } from '../services/application-config'
import { useTopologyNodes } from '../services/useTopologyNodes/index.ts'
import type { TopologyNode } from '@deltares/fews-pi-requests'
import { computed } from 'vue'

const TIME_SERIES_DIALOG_PANEL: string = 'time series dialog'

interface Props {
  nodeId?: string
}

function anyChildNodeIsVisible(nodes: TopologyNode[] | undefined): boolean {
  if (nodes === undefined) return false
  for (const node of nodes) {
    if (topologyNodeIsVisible(node)) return true
  }
  return false
}

function topologyNodeIsVisible(node: TopologyNode): boolean {
  if (node.url !== undefined) return true
  if (node.displayId !== undefined) return true
  if (node.displayGroups !== undefined && node.displayGroups.length > 0)
    return true
  return anyChildNodeIsVisible(node.topologyNodes)
}

function recursiveUpdateNode(nodes: TopologyNode[]) {
  return nodes
    .filter((node) => topologyNodeIsVisible(node))
    .map((node) => {
      const result: ColumnItem = {
        id: node.id,
        name: node.name,
        icon: getIcon(node),
      }
      if (node.topologyNodes) {
        result.children = recursiveUpdateNode(node.topologyNodes)
      } else {
        if (
          node.url !== undefined &&
          node.mainPanel !== TIME_SERIES_DIALOG_PANEL
        ) {
          result.href = node.url
          result.target = node.url
        } else {
          result.to = {
            name: 'TimeSeriesDisplay',
            params: {
              nodeId: node.id,
            },
          }
        }
      }
      return result
    })
}

function getIcon(node: TopologyNode): string | undefined {
  if (node.url && node.mainPanel !== TIME_SERIES_DIALOG_PANEL)
    return 'mdi-share'
  return undefined
}

const props = withDefaults(defineProps<Props>(), {
  nodeId: '',
})

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')

const active = ref<string[]>([])
const open = ref<string[]>([])
const items = ref<ColumnItem[]>([])

const selectedPlot = ref(0)

const { nodes, displays, sublots } = useTopologyNodes(
  baseUrl,
  () => props.nodeId,
  selectedPlot,
)

const plotIds = computed(() => {
  if (displays.value?.length) {
    const ids = displays.value.map((d) => {
      return d[0].title
    })
    return ids
  } else {
    return []
  }
})

onMounted(async () => {})

function updateItems(): void {
  if (nodes.value) {
    const _items = recursiveUpdateNode(nodes.value)
    items.value = _items
    open.value = [_items[0].id]
  }
}

watch(nodes, updateItems)
</script>
