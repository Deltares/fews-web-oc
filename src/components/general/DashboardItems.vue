<template>
  <v-tabs
    v-model="tab"
    v-if="items.length > 1"
    bg-color="primary"
    align-tabs="center"
    class="flex-0-0 w-100"
    density="compact"
  >
    <v-tab
      v-for="item in componentItems"
      :prepend-icon="item.icon"
      class="text-none"
    >
      {{ item.title }}
    </v-tab>
  </v-tabs>

  <template v-for="(item, i) in componentItems">
    <component
      v-if="tab === i"
      class="overflow-auto flex-1-1"
      :is="item.component"
      v-bind="item.componentProps"
      :topologyNode="item.topologyNode"
      :settings="item.settings"
    />
  </template>
</template>

<script setup lang="ts">
import type { DashboardItem } from '@/lib/dashboard/types'
import {
  componentTypeToIconMap,
  componentTypeToTitleMap,
} from '@/lib/topology/component'
import {
  componentTypeToComponentMap,
  getComponentPropsForNode,
} from '@/lib/topology/dashboard'
import { useComponentSettingsStore } from '@/stores/componentSettings'
import { useTopologyNodesStore } from '@/stores/topologyNodes'
import { computed, ref, watch } from 'vue'

interface Props {
  items: DashboardItem[]
}

const props = defineProps<Props>()

const tab = ref(0)

const topologyNodesStore = useTopologyNodesStore()
const componentSettingsStore = useComponentSettingsStore()

function getComponentSettingsForItem(item: DashboardItem) {
  const settings = componentSettingsStore.getSettingsById(
    item.componentSettingsId,
  )
  const componentSettings = settings?.[item.component]
  if (!componentSettings) return

  componentSettings.declarations = settings?.declarations
  return componentSettings
}

const componentItems = computed(() => {
  return props.items.map((item) => {
    const componentName = item.component
    const topologyNode = topologyNodesStore.getNodeById(item.topologyNodeId)
    const component = componentTypeToComponentMap[componentName]
    const componentProps = getComponentPropsForNode(componentName, topologyNode)
    const title = topologyNode?.name ?? componentTypeToTitleMap[componentName]
    const icon = componentTypeToIconMap[componentName]
    const settings = getComponentSettingsForItem(item)
    return {
      title,
      icon,
      component,
      componentProps,
      componentName,
      topologyNode,
      settings,
    }
  })
})

watch(componentItems, () => {
  tab.value = 0
})
</script>
