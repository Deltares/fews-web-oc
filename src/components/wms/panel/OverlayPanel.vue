<template>
  <v-list density="compact">
    <v-list-item-subtitle class="ps-3 pb-1">
      {{ t('wms.layers') }}
    </v-list-item-subtitle>
    <draggable
      v-model="overlays"
      item-key="id"
      class="list-group"
      ghost-class="overlay-panel__ghost"
    >
      <template #item="{ element }">
        <v-list-item density="compact">
          <template #prepend>
            <v-list-item-action start>
              <v-icon
                icon="mdi-drag-vertical"
                size="small"
                class="drag-handle"
              />
            </v-list-item-action>
            <v-list-item-action start v-if="element.type === 'overLay'">
              <v-checkbox-btn v-model="element.visible" />
            </v-list-item-action>
            <v-list-item-action class="overlay-panel__wms-icon" v-else >
              <v-icon icon="mdi-layers"/>
            </v-list-item-action>
          </template>
          <v-list-item-title>{{ getTitle(element) }}</v-list-item-title>
          <v-list-item-subtitle v-if="element.type === 'overLay'">
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
              class="overlay-panel__gradient-slider"
            />
          </v-list-item-subtitle>
        </v-list-item>
      </template>
    </draggable>
  </v-list>
</template>

<script setup lang="ts">
import draggable from 'vuedraggable'
import type {
  GetCapabilitiesResponse,
  Layer,
} from '@deltares/fews-wms-requests'
import { useI18n } from 'vue-i18n'
import type { Overlay } from '@/services/useOverlays'
const { t } = useI18n()

interface Props {
  layer: Layer | undefined
  capabilities: GetCapabilitiesResponse | undefined
}

const props = defineProps<Props>()
const overlays = defineModel<Overlay[]>('overlays')

function getTitle(overlay: Overlay): string {
  if (overlay.type === 'gridLayer') {
    return props.layer?.title ?? 'wms'
  }

  const foundLayer = props.capabilities?.layers.find(
    (layer) => layer.name === overlay.id,
  )
  return foundLayer?.title ?? overlay.id ?? 'Unnamed overlay'
}
</script>

<style scoped>
.overlay-panel__ghost {
  opacity: 0.5;
  background: #c8ebfb;
}

:deep(.v-slider.v-input--horizontal > .v-input__control) {
  height: 12px !important;
  min-height: 12px !important;
}

.overlay-panel__gradient-slider :deep(.v-slider-track__background) {
  background: linear-gradient(
    to right,
    rgba(var(--v-theme-on-surface), 0) 0%,
    rgba(var(--v-theme-on-surface), 1) 100%
  ) !important;
}

.overlay-panel__gradient-slider :deep(.v-slider-track__fill) {
  opacity: 0 !important;
}

.overlay-panel__wms-icon {
  width: 28px;
  justify-content: center;
}
</style>
