<template>
  <v-tabs
    v-model="tab"
    v-if="items.length > 1"
    bg-color="primary"
    align-tabs="center"
    class="flex-0-0 w-100"
    density="compact"
  >
    <v-tab v-for="item in componentItems" :prepend-icon="item.icon">
      {{ item.componentName }}
    </v-tab>
  </v-tabs>

  <template v-for="(item, i) in componentItems">
    <component
      v-if="tab === i"
      class="overflow-auto flex-1-1"
      :is="item.component"
      v-bind="item.componentProps"
      :topologyNode="item.topologyNode"
    />
  </template>
</template>

<script setup lang="ts">
import type { DashboardItem } from '@/lib/dashboard/types'
import {
  getComponentForName,
  getComponentPropsForNode,
  getIconForComponentName,
} from '@/lib/topology/dashboard'
import { useTopologyNodesStore } from '@/stores/topologyNodes'
import { computed, ref, watch } from 'vue'

interface Props {
  items: DashboardItem[]
}

const props = defineProps<Props>()

const tab = ref(0)

const topologyNodesStore = useTopologyNodesStore()

const componentItems = computed(() => {
  return props.items.map((item) => {
    const componentName = item.component
    const topologyNode = topologyNodesStore.getNodeById(item.topologyNodeId)
    const component = getComponentForName(componentName)
    const componentProps = getComponentPropsForNode(componentName, topologyNode)
    const icon = getIconForComponentName(componentName)
    return {
      component,
      componentProps,
      componentName,
      topologyNode,
      icon,
    }
  })
})

watch(componentItems, () => {
  tab.value = 0
})
</script>
