<template>
  <Teleport to="body" :disabled="!isFullscreen">
    <v-card
      :style="{ gridArea: gridTemplateArea }"
      class="d-flex flex-column"
      :class="{ fullscreen: isFullscreen }"
      density="compact"
    >
      <v-toolbar density="compact" height="50" class="flex-0-0">
        <v-toolbar-title class="ms-3 text-capitalize text-body-1">
          {{ props.title }}
        </v-toolbar-title>

        <v-tabs v-model="tab" v-if="items.length > 1" align-tabs="center">
          <v-tab
            v-for="item in componentItems"
            :prepend-icon="item.icon"
            class="text-none"
          >
            {{ item.title }}
          </v-tab>
        </v-tabs>

        <v-spacer />

        <v-btn
          :icon="isFullscreen ? 'mdi-fullscreen-exit' : 'mdi-fullscreen'"
          density="compact"
          class="me-1"
          @click="isFullscreen = !isFullscreen"
        />
      </v-toolbar>

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
    </v-card>
  </Teleport>
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
  title: string
  gridTemplateArea: string
  items: DashboardItem[]
}

const props = defineProps<Props>()

const tab = ref(0)

const topologyNodesStore = useTopologyNodesStore()
const componentSettingsStore = useComponentSettingsStore()

const isFullscreen = ref(false)

function getComponentSettingsForItem(item: DashboardItem) {
  const settings = componentSettingsStore.getSettingsById(
    item.componentSettingsId,
  )
  return settings?.[item.component]
}

const componentItems = computed(() => {
  return props.items.map((item) => {
    const componentName = item.component
    const topologyNode = topologyNodesStore.getNodeById(item.topologyNodeId)
    const component = componentTypeToComponentMap[componentName]
    const componentProps = getComponentPropsForNode(componentName, topologyNode)
    const title = topologyNode?.name ?? componentTypeToTitleMap[componentName]
    const icon = topologyNode?.iconId ?? componentTypeToIconMap[componentName]
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

<style scoped>
.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 2000;
}
</style>
