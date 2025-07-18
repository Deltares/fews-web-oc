<template>
  <v-list-item prepend-icon="mdi-layers-outline">
    <span class="pa-0">Overlays</span>
    <v-list-item
      title="Select All"
      @click="toggleAll"
      class="ps-1"
      density="compact"
    >
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
      v-model:selected="selectedOverlayIds"
      select-strategy="leaf"
      class="pa-0"
      density="compact"
      max-height="160"
    >
      <v-list-item
        v-for="overlay in overlays"
        :key="overlay.id"
        :title="overlay.name"
        :value="overlay.id"
        :active="false"
        class="ps-1"
        density="compact"
      >
        <template #prepend="{ isSelected, select }">
          <v-list-item-action start>
            <v-checkbox-btn
              :model-value="isSelected"
              @update:model-value="select"
              density="compact"
            />
          </v-list-item-action>
        </template>
      </v-list-item>
    </v-list>
  </v-list-item>
</template>

<script setup lang="ts">
import { Overlay } from '@deltares/fews-pi-requests'
import { computed } from 'vue'

interface Props {
  overlays: Overlay[]
}

const props = defineProps<Props>()

const selectedOverlayIds = defineModel<string[]>('selectedOverlayIds', {
  required: true,
})

const allSelected = computed(
  () => props.overlays.length === selectedOverlayIds.value.length,
)

const someSelected = computed(
  () =>
    selectedOverlayIds.value.length > 0 &&
    selectedOverlayIds.value.length < props.overlays.length,
)

function toggleAll() {
  if (allSelected.value) {
    selectedOverlayIds.value = []
  } else {
    selectedOverlayIds.value = props.overlays
      .map((overlay) => overlay.id)
      .filter((id) => id !== undefined)
  }
}
</script>
