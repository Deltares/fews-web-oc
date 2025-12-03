<template>
  <v-card
    @click="onExpansionPanelToggle"
    :ripple="false"
    :border="true"
    flat
    density="compact"
  >
    <!-- Row 1: Date + Source + Error count (summary) -->
    <div class="d-flex w-100 justify-space-between align-left">
      <v-list-item class="px-2 date-time-item">
        <v-list-item-subtitle v-if="expanded">
          Last import time
        </v-list-item-subtitle>
        <v-chip
          :color="item.lastImportTimeBackgroundColor"
          :variant="isDark ? 'tonal' : 'flat'"
          size="small"
        >
          {{ toHumanReadableDateTime(item.lastImportTime) }}
        </v-chip>
      </v-list-item>
      <v-list-item class="flex-grow-1 align-self-left ps-2">
        <v-list-item-subtitle> Source </v-list-item-subtitle>
        <span
          class="text-body-2 text-truncate"
          :class="[
            item.fileFailed > 0 && !expanded
              ? 'datafeed-label'
              : 'datafeed-label long',
          ]"
        >
          {{ item.dataFeed }}
        </span>
        <template v-slot:append>
          <transition name="fade-slide">
            <v-chip
              v-show="!expanded && item.fileFailed > 0"
              :color="item.fileFailed ? 'error' : 'grey'"
              size="small"
              variant="flat"
            >
              {{ item.fileFailed }}
            </v-chip>
          </transition>
        </template>
      </v-list-item>
    </div>
    <v-expand-transition>
      <div v-if="expanded">
        <v-list-item>
          <v-list-item-subtitle>Directory</v-list-item-subtitle>
          <span class="text-body-2">{{ item.directory }}</span>
        </v-list-item>

        <v-list-item>
          <v-list-item-subtitle>Last file</v-list-item-subtitle>
          <span class="text-body-2">{{ item.lastFileImported }}</span>
        </v-list-item>

        <div class="d-flex w-100 justify-space-between align-left">
          <v-list-item class="flex-grow-1">
            <v-list-item-subtitle>Files imported</v-list-item-subtitle>
            <template v-slot:append>
              <transition name="fade-slide">
                <v-chip
                  v-if="expanded"
                  size="small"
                  color="grey"
                  variant="flat"
                >
                  {{ item.fileRead }}
                </v-chip>
              </transition>
            </template>
          </v-list-item>
          <v-list-item class="flex-grow-1">
            <v-list-item-subtitle>Files failed</v-list-item-subtitle>
            <template v-slot:append>
              <transition name="fade-slide">
                <v-chip
                  v-if="expanded"
                  :color="item.fileFailed ? 'error' : 'grey'"
                  size="small"
                  variant="flat"
                >
                  {{ item.fileFailed }}
                </v-chip>
              </transition>
            </template>
          </v-list-item>
        </div>
      </div>
    </v-expand-transition>
  </v-card>
</template>
<script setup lang="ts">
import type { ImportStatus } from '@deltares/fews-pi-requests'
import { toHumanReadableDateTime } from '@/lib/date'
import { useDark } from '@vueuse/core'

export interface ImportStatusDirectory extends ImportStatus {
  directory: string
}

interface Props {
  item: ImportStatusDirectory
}
const { item } = defineProps<Props>()

const expanded = defineModel<boolean>('expanded', {
  required: false,
  default: false,
})

const isDark = useDark()

function onExpansionPanelToggle() {
  // Only expand when no text is selected
  if (window.getSelection()?.toString() === '') {
    expanded.value = !expanded.value
  }
}
</script>

<style scoped>
.date-time-item {
  min-width: 155px;
}

.datafeed-label {
  display: inline-block;
  width: 200px;
  transition: width 0.1s ease;
  transition-delay: 0s;
}

.datafeed-label.long {
  width: 240px;
  transition-delay: 0.3s;
}

/* Smooth slide + fade for chip transitions */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-slide-leave-active {
  transition-delay: 0s;
}

.fade-slide-enter-active {
  transition-delay: 0.1s;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(136px);
}
</style>
