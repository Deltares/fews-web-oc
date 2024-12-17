<template>
  <ControlChip v-if="componentSettingsStore.overlays.length">
    <v-icon size="large">mdi-layers-outline</v-icon>
    <v-menu
      transition="slide-y-transition"
      :close-on-content-click="false"
      activator="parent"
    >
      <v-list
        v-model:selected="componentSettingsStore.selectedOverlayIds"
        select-strategy="leaf"
        class="pb-0"
        density="compact"
      >
        <v-list-item title="Select All" @click="toggleAll">
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

        <v-divider class="mt-2" />

        <v-list-item
          v-for="overlay in componentSettingsStore.overlays"
          :key="overlay.id"
          :title="overlay.name"
          :value="overlay.id"
        >
          <template #prepend="{ isSelected }">
            <v-list-item-action start>
              <v-checkbox-btn :model-value="isSelected" density="compact" />
            </v-list-item-action>
          </template>
        </v-list-item>
      </v-list>
    </v-menu>
  </ControlChip>
</template>

<script setup lang="ts">
import ControlChip from '@/components/wms/ControlChip.vue'
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
