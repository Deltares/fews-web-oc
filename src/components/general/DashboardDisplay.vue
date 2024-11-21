<template>
  <div class="dashboard-container ga-3 pa-3">
    <template v-for="panel in panelItems">
      <v-card
        v-if="panel.component"
        :style="{ gridArea: panel.id }"
        class="dashboard-card"
        density="compact"
        :flat="panel.id.includes('ssd')"
      >
        <component
          class="overflow-auto"
          :is="panel.component"
          v-bind="panel.props"
          :topologyNode="panel.node"
        />
      </v-card>
      <v-alert
        v-else
        :title="`${panel.id} not implemented`"
        :style="{ gridArea: panel.id }"
        class="ma-2"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { getComponentWithPropsForNode } from '@/lib/topology/dashboard'
import type { TopologyNode } from '@deltares/fews-pi-requests'
import { computed, watch } from 'vue'

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
    return {
      id: panel.id,
      title: panel.name,
      node: panel,
      component,
      props,
    }
  })
})

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
    if (oldCss) removeCss(oldCss)
    loadCss(newCss)
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

.dashboard-card {
  display: flex;
  flex-direction: column;
  background-color: transparent;
}
</style>
