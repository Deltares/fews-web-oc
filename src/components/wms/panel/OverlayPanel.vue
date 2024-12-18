<template>
  <v-list-item prepend-icon="mdi-layers-outline">
    <v-list-item title="Select All" @click="toggleAll" class="ps-1">
      <template #prepend>
        <v-list-item-action start>
          <v-checkbox-btn
            :indeterminate="someSelected && !allSelected"
            :model-value="allSelected"
            density="compact"
          />
        </v-list-item-action>
      </template>
    </v-list-item>
    <v-divider />
    <v-list
      v-model:selected="componentSettingsStore.selectedOverlayIds"
      select-strategy="leaf"
      class="pa-0"
      density="compact"
      max-height="160"
    >
      <v-list-item
        v-for="overlay in componentSettingsStore.overlays"
        :key="overlay.id"
        :title="overlay.name"
        :value="overlay.id"
        :active="false"
        class="ps-1"
      >
        <template #prepend="{ isSelected }">
          <v-list-item-action start>
            <v-checkbox-btn :model-value="isSelected" density="compact" />
          </v-list-item-action>
        </template>
      </v-list-item>
    </v-list>
  </v-list-item>
</template>

<script setup lang="ts">
import { useComponentSettingsStore } from '@/stores/componentSettings'
import { computed } from 'vue'

const componentSettingsStore = useComponentSettingsStore()

const allSelected = computed(
  () =>
    componentSettingsStore.overlays.length ===
    componentSettingsStore.selectedOverlayIds.length,
)

const someSelected = computed(
  () =>
    componentSettingsStore.selectedOverlayIds.length > 0 &&
    componentSettingsStore.selectedOverlayIds.length <
      componentSettingsStore.overlays.length,
)

function toggleAll() {
  if (allSelected.value) {
    componentSettingsStore.selectedOverlayIds = []
  } else {
    componentSettingsStore.selectedOverlayIds =
      componentSettingsStore.overlays.map((overlay) => overlay.id)
  }
}
</script>
