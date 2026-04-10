<template>
  <v-list density="compact">
    <v-list-item-subtitle class="ps-3 pb-1">
      {{ t('wms.overlays') }}
    </v-list-item-subtitle>
    <draggable
      v-model="overlays"
      :disabled="!enabled" 
      item-key="name"
      class="list-group"
      ghost-class="ghost"
    >
      <template #item="{ element }">
        <v-list-item :class="{ 'not-draggable': !enabled }" density="compact">
          <template #prepend>
            <v-list-item-action start>
              <v-icon
                v-if="enabled"
                icon="mdi-drag-vertical"
                size="small"
                class="drag-handle"
              />
            </v-list-item-action>
            <v-list-item-action start>
              <v-checkbox-btn
                :modelValue="
                  selectedOverlayIds.includes(element.id ?? '')
                "
                @update:model-value="
                  (value) => {
                    selectOverlayId(element.id ?? '', value as boolean)
                  }
                "
                density="compact"
              />
            </v-list-item-action>
          </template>
          <v-list-item-title>{{ getTitle(element) }}</v-list-item-title>
          <v-list-item-subtitle>
            <v-slider
              v-model="element.opacity"
              :min="0"
              :max="1"
              :step="0.1"
              density="compact"
              :track-fill-color="`rgba(0, 0, 0, ${element.opacity})`"
              hide-details
              thumb-size="12"
              height="12"
              class="gradient-slider"
            />
          </v-list-item-subtitle>
        </v-list-item>
      </template>
    </draggable>
  </v-list>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import draggable from 'vuedraggable'
import type { Overlay } from '@deltares/fews-pi-requests'
import type { GetCapabilitiesResponse } from '@deltares/fews-wms-requests'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

interface Props {
  capabilities: GetCapabilitiesResponse | undefined
}

const props = defineProps<Props>()
const overlays = defineModel<Overlay[]>('overlays', {
  default: () => []
})

function getTitle(overlay: Overlay): string {
  const foundLayer = props.capabilities?.layers.find(
    (layer) => layer.name === overlay.id,
  )
  return foundLayer?.title ?? overlay.id ?? 'Unnamed overlay'
}

const selectedOverlayIds = defineModel<string[]>('selectedOverlayIds', {
  required: true,
})

function selectOverlayId(overlayId: string, value: boolean) {
  const index = selectedOverlayIds.value.indexOf(overlayId)
  if (value) {
    if (index === -1) {
      selectedOverlayIds.value.push(overlayId)
    }
  } else {
    if (index !== -1) {
      selectedOverlayIds.value.splice(index, 1)
    }
  }
}


const enabled = ref(true)
</script>

<style scoped>
.ghost {
  opacity: 0.5;
  background: #c8ebfb;
}

.not-draggable {
  cursor: no-drop;
}
</style>

<style>
.gradient-slider .v-slider-track__background {
  background: linear-gradient(
    to right,
    rgba(var(--v-theme-on-surface), 0) 0%,
    rgba(var(--v-theme-on-surface), 1) 100%
  ) !important;
}

.gradient-slider .v-slider-track__fill {
  opacity: 0 !important;
}

.v-slider.v-input--horizontal > .v-input__control {
  height: 12px !important;
  min-height: 12px !important;
}
</style>
