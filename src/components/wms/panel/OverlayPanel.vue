<template>
  <v-list
    v-model:selected="selectedOverlayIds"
    select-strategy="leaf"
    density="compact"
  >
    <v-list-item-subtitle class="ps-3 pb-1">
      {{ t('wms.overlays') }}
    </v-list-item-subtitle>
    <v-list-item
      v-for="overlay in overlays"
      :key="overlay.id"
      :title="getTitle(overlay)"
      :value="overlay.id"
      :active="false"
      min-height="32"
      rounded
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
</template>

<script setup lang="ts">
import type { Overlay } from '@deltares/fews-pi-requests'
import type { GetCapabilitiesResponse } from '@deltares/fews-wms-requests'

import { useI18n } from 'vue-i18n'

const { t } = useI18n()

interface Props {
  overlays: Overlay[]
  capabilities: GetCapabilitiesResponse | undefined
}

const props = defineProps<Props>()

function getTitle(overlay: Overlay): string {
  const foundLayer = props.capabilities?.layers.find(
    (layer) => layer.name === overlay.id,
  )
  return foundLayer?.title ?? overlay.id ?? 'Unnamed overlay'
}

const selectedOverlayIds = defineModel<string[]>('selectedOverlayIds', {
  required: true,
})
</script>
