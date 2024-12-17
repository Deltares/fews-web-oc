<template>
  <ControlChip v-if="componentSettingsStore.baseMaps.length">
    <v-icon size="large">mdi-map</v-icon>
    <v-menu
      transition="slide-y-transition"
      :close-on-content-click="false"
      activator="parent"
    >
      <v-list class="pb-0" density="compact">
        <v-list-item
          v-for="basemap in componentSettingsStore.baseMaps"
          :key="basemap.id"
          :title="basemap.name"
          :value="basemap.id"
          :active="basemap.id === componentSettingsStore.selectedBaseMapId"
          @click="componentSettingsStore.selectedBaseMapId = basemap.id"
        />
      </v-list>
    </v-menu>
  </ControlChip>
</template>

<script setup lang="ts">
import ControlChip from '@/components/wms/ControlChip.vue'
import { useComponentSettingsStore } from '@/stores/componentSettings'

const componentSettingsStore = useComponentSettingsStore()
</script>
