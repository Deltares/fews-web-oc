<template>
  <v-app :theme="theme">
    <v-main class="pa-4">
      <v-list>
        <TreeMenuRow
          :item="{
            id: 'group',
            name: 'Group',
            children: [{ id: 'leaf', name: 'Leaf' }],
          }"
          :depth="1"
        />
        <UserSettingsOneOfMultiple v-model="selected" :setting="setting" />
      </v-list>
      <div style="width: 400px">
        <OverlayPanel
          v-model:overlays="overlays"
          :layer="undefined"
          :capabilities="undefined"
        />
      </div>
      <NewLogMessage mode="edit" initial-text="A log message" />
      <ChartLegend
        :tags="tags"
        :margin="{}"
        :settings="defaultChartSettings.timeSeriesChart.legend"
      />
      <div style="position: relative; height: 100px">
        <ChartLegendOverlay
          :tags="tags"
          :margin="{}"
          :settings="defaultChartSettings.timeSeriesChart.legend"
        />
      </div>
      <div style="height: 100px">
        <!-- Not fetched: the SSD web component is not registered in the gallery -->
        <SsdComponent src="http://localhost/ssd" />
      </div>
      <EditableTitle v-model="title" />
      <div class="maplibregl-ctrl maplibregl-ctrl-group">
        <button type="button" aria-label="Zoom in">+</button>
      </div>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { provide, ref } from 'vue'
import { createMemoryHistory, createRouter, routeLocationKey } from 'vue-router'
import type { Tag } from '@/lib/charts/tags'
import { defaultChartSettings } from '@/lib/topology/componentSettings/chartSettings'
import type { Overlay } from '@/services/useOverlays'
import type { UserSettingsItemOneOf } from '@/stores/userSettings'
import TreeMenuRow from './TreeMenuRow.vue'
import UserSettingsOneOfMultiple from '@/components/user-settings/UserSettingsOneOfMultiple.vue'
import OverlayPanel from '@/components/wms/panel/OverlayPanel.vue'
import NewLogMessage from '@/components/logdisplay/NewLogMessage.vue'
import ChartLegend from '@/components/charts/ChartLegend.vue'
import ChartLegendOverlay from '@/components/charts/ChartLegendOverlay.vue'
import SsdComponent from '@/components/ssd/SsdComponent.vue'
import EditableTitle from './EditableTitle.vue'
import 'maplibre-gl/dist/maplibre-gl.css'

withDefaults(defineProps<{ theme?: string }>(), { theme: 'light' })

const router = createRouter({ history: createMemoryHistory(), routes: [] })
provide(routeLocationKey, router.currentRoute.value)

const selected = ref('first')
const title = ref('Editable title')
const setting: UserSettingsItemOneOf = {
  id: 'test.style',
  label: 'Style test',
  type: 'oneOfMultiple',
  value: 'first',
  group: 'test',
  favorite: false,
  items: [
    { value: 'first', title: 'First' },
    { value: 'second', title: 'Second' },
  ],
}
const overlays = ref<Overlay[]>([
  { type: 'overLay', id: 'test-overlay', visible: true, opacity: 0.5 },
])
const tags: Tag[] = [
  {
    id: 'static',
    name: 'Non-interactive legend',
    disabled: false,
    interactive: false,
    legendSvg: '',
  },
]
</script>
