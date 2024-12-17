<template>
  <ControlChip v-if="overlays.length">
    <v-icon size="large">mdi-layers-outline</v-icon>
    <v-menu
      transition="slide-y-transition"
      :close-on-content-click="false"
      activator="parent"
    >
      <v-list
        v-model:selected="selectedIds"
        select-strategy="leaf"
        class="pb-0"
      >
        <v-list-item title="Select All" @click="toggleAll">
          <template #prepend>
            <v-list-item-action start>
              <v-checkbox-btn
                :indeterminate="someSelected && !allSelected"
                :model-value="allSelected"
              />
            </v-list-item-action>
          </template>
        </v-list-item>

        <v-divider class="mt-2" />

        <v-list-item
          v-for="overlay in overlays"
          :key="overlay.id"
          :title="overlay.name"
          :value="overlay.id"
        >
          <template #prepend="{ isSelected }">
            <v-list-item-action start>
              <v-checkbox-btn :model-value="isSelected" />
            </v-list-item-action>
          </template>
        </v-list-item>
      </v-list>
    </v-menu>
  </ControlChip>
</template>

<script setup lang="ts">
import ControlChip from '@/components/wms/ControlChip.vue'
import {
  DeclarationReference,
  OverlayLocation,
  type MapSettings,
} from '@/lib/topology/componentSettings'
import { computed, ref, watchEffect } from 'vue'

interface Props {
  settings?: MapSettings
}

const props = defineProps<Props>()

const selectedIds = ref<string[]>([])
watchEffect(() => {
  selectedIds.value = getVisibleOverlayIds(props.settings?.overlays ?? [])
})

const selectedOverlays = defineModel<OverlayLocation[]>()
watchEffect(() => {
  selectedOverlays.value = getOverlocationsByIds(selectedIds.value)
})

const overlays = computed(() => {
  const overlayIds = props.settings?.overlays?.map((overlay) => overlay.id)
  return getOverlocationsByIds(overlayIds ?? [])
})

const allSelected = computed(
  () => selectedIds.value.length === overlays.value.length,
)

const someSelected = computed(
  () =>
    selectedIds.value.length > 0 &&
    selectedIds.value.length < overlays.value.length,
)

function toggleAll() {
  if (allSelected.value) {
    selectedIds.value = []
  } else {
    selectedIds.value = overlays.value.map((overlay) => overlay.id)
  }
}

function getOverlayById(id: string) {
  return props.settings?.declarations?.overlays?.locations?.find(
    (overlay) => overlay.id === id,
  )
}

function getOverlocationsByIds(ids: string[]) {
  return ids.map((id) => getOverlayById(id)).filter((overlay) => !!overlay)
}

function getVisibleOverlayIds(references: DeclarationReference[]) {
  return (
    references
      ?.filter((overlay) => overlay.visible)
      .map((overlay) => overlay.id) ?? []
  )
}
</script>
