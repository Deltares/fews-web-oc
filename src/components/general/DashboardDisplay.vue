<template>
  <div class="dashboard-container">
    <template v-for="panel in panelItems">
      <component
        v-if="panel.component"
        :is="panel.component"
        v-bind="panel.props"
        :topologyNode="panel.node"
        :style="panel.style"
      />
      <v-alert
        v-else
        :title="`${panel.id} not implemented`"
        :style="panel.style"
        class="ma-2"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { getComponentWithPropsForNode } from '@/lib/topology/dashboard'
import type { TopologyNode } from '@deltares/fews-pi-requests'
import { type StyleValue, computed, watch } from 'vue'

interface Dashboard {
  id: string
  css: string
  panels: TopologyNode[]
}

interface Props {
  dashboard: Dashboard
}

const props = defineProps<Props>()

const panelItems = computed(() => {
  return props.dashboard.panels.map((panel) => {
    const { component, props } = getComponentWithPropsForNode(panel)
    const style = getStyleForPanel(panel)
    return {
      id: panel.id,
      node: panel,
      component,
      props,
      style,
    }
  })
})

function getStyleForPanel(panel: TopologyNode): StyleValue {
  return {
    gridArea: panel.id,
  }
}

function loadCss(url: string) {
  if (!document.querySelector(`link[href="${url}"]`)) {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = url
    document.head.appendChild(link)
  }
}

function removeCss(url: string) {
  const link = document.querySelector(`link[href="${url}"]`)
  if (link) {
    link.remove()
  }
}

watch(
  () => props.dashboard.css,
  (newCss, oldCss) => {
    if (oldCss) removeCss(`/css/${oldCss}`)
    loadCss(`/css/${newCss}`)
  },
  { immediate: true },
)
</script>

<style scoped>
.dashboard-container {
  display: grid;
  height: 100%;
  width: 100%;
}
</style>
