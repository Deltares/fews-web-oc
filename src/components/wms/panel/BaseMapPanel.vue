<template>
  <v-list-item prepend-icon="mdi-map" class="pe-1">
    <v-list class="pa-0" density="compact" max-height="160">
      <v-list-item
        v-for="basemap in componentSettingsStore.baseMaps"
        :key="basemap.id"
        :title="basemap.name"
        @click="componentSettingsStore.selectedBaseMapId = basemap.id"
        class="ps-0"
      >
        <template
          #append
          v-if="basemap.id === componentSettingsStore.selectedBaseMapId"
        >
          <v-icon>mdi-check</v-icon>
        </template>
      </v-list-item>
    </v-list>
  </v-list-item>
</template>

<script setup lang="ts">
import { useComponentSettingsStore } from '@/stores/componentSettings'

const componentSettingsStore = useComponentSettingsStore()
</script>
