<template>
  <v-list density="compact">
    <v-list-item-subtitle class="ps-3 pb-1">
      {{ t('wms.overlays') }}
    </v-list-item-subtitle>
    <draggable
      :list="list"
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
                icon="mdi-drag"
                size="small"
                class="drag-handle"
              />
            </v-list-item-action>
            <v-list-item-action start>
              <v-checkbox-btn
                :modelValue="
                  selectedOverlayIds.includes(element.overlayId ?? '')
                "
                @update:model-value="
                  (value) => {
                    console.log(value)
                    selectOverlayId(element.overlayId ?? '', value as boolean)
                  }
                "
                density="compact"
              />
            </v-list-item-action>
          </template>
          <v-list-item-title>{{ element.name }}</v-list-item-title>
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

interface ListItem {
  id: number
  overlayId?: string
  name: string
}

const enabled = ref(true)
const list = ref<ListItem[]>(
  props.overlays.map((o, index) => ({
    id: index,
    overlayId: o.id,
    name: getTitle(o),
  })),
)
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
