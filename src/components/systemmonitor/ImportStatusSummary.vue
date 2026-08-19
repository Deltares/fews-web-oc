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
          Last successful time
        </v-list-item-subtitle>
        <v-chip
          :color="item.lastSuccessfulTimeBackgroundColor"
          :variant="isDark ? 'tonal' : 'flat'"
          size="small"
        >
          {{ item.lastSuccessfulTime ? toHumanReadableDateTime(item.lastSuccessfulTime) : '-' }}
        </v-chip>
      </v-list-item>
      <v-list-item class="flex-grow-1 align-self-left ps-2">
        <v-list-item-subtitle>
          Source
          <v-chip size="x-small" class="ms-1" variant="tonal">
            {{ item.statusType }}
          </v-chip>
        </v-list-item-subtitle>
        <span
          class="text-body-2 text-truncate"
          :class="[
            item.filesFailedCount > 0 && !expanded
              ? 'datafeed-label'
              : 'datafeed-label long',
          ]"
        >
          {{ item.dataFeed }}
        </span>
        <template v-slot:append>
          <transition name="fade-slide">
            <v-chip
              v-show="!expanded && item.filesFailedCount > 0"
              :color="item.filesFailedCount ? 'error' : 'grey'"
              size="small"
              variant="flat"
            >
              {{ item.filesFailedCount }}
            </v-chip>
          </transition>
        </template>
      </v-list-item>
    </div>
    <v-expand-transition>
      <div v-if="expanded">
        <v-list-item>
          <v-list-item-subtitle>Task run ID</v-list-item-subtitle>
          <span class="text-body-2">{{ textValue(item.taskRunId) }}</span>
        </v-list-item>

        <v-list-item>
          <v-list-item-subtitle>Workflow ID</v-list-item-subtitle>
          <span class="text-body-2">{{ textValue(item.workflowId) }}</span>
        </v-list-item>

        <v-list-item>
          <v-list-item-subtitle>Workflow name</v-list-item-subtitle>
          <span class="text-body-2">{{ textValue(item.workflowName) }}</span>
        </v-list-item>

        <v-list-item>
          <v-list-item-subtitle>Directory</v-list-item-subtitle>
          <span class="text-body-2">{{ item.directory }}</span>
        </v-list-item>

        <v-list-item>
          <v-list-item-subtitle>{{ feedMeta.label }}</v-list-item-subtitle>
          <div class="d-flex align-center ga-1">
            <span class="text-body-2">{{ textValue(feedMeta.value) }}</span>
            <v-tooltip
              v-if="feedMeta.showTooltip"
              location="top"
              :text="item.dataFeedDescription"
            >
              <template #activator="{ props }">
                <v-icon
                  v-bind="props"
                  size="16"
                  icon="mdi-information-outline"
                  color="primary"
                  @click.stop
                />
              </template>
            </v-tooltip>
          </div>
        </v-list-item>

        <v-list-item>
          <v-list-item-subtitle>Last file</v-list-item-subtitle>
          <span class="text-body-2">{{ item.lastSuccessfulFile }}</span>
        </v-list-item>

        <v-list-item>
          <v-list-item-subtitle>Status</v-list-item-subtitle>
          <span class="text-body-2">{{ textValue(item.status) }}</span>
        </v-list-item>

        <div class="d-flex w-100 justify-space-between align-left">
          <v-list-item class="flex-grow-1">
            <v-list-item-subtitle>Files successful</v-list-item-subtitle>
            <template v-slot:append>
              <transition name="fade-slide">
                <v-chip
                  v-if="expanded"
                  size="small"
                  color="grey"
                  variant="flat"
                >
                  {{ item.filesSuccessfulCount }}
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
                  :color="item.filesFailedCount ? 'error' : 'grey'"
                  size="small"
                  variant="flat"
                >
                  {{ item.filesFailedCount }}
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
import { computed } from 'vue'
import type { ImportExportStatusItem } from './statusTypes'
import { toHumanReadableDateTime } from '@/lib/date'
import { useDark } from '@/services/useDark'

interface Props {
  item: ImportExportStatusItem
}
const { item } = defineProps<Props>()

const expanded = defineModel<boolean>('expanded', {
  required: false,
  default: false,
})

const isDark = useDark()

function onExpansionPanelToggle() {
  // Only expand when no text is selected
  if (globalThis.getSelection()?.toString() === '') {
    expanded.value = !expanded.value
  }
}

function textValue(value?: string): string {
  return value && value.trim() !== '' ? value : '-'
}

function hasText(value?: string): boolean {
  return Boolean(value && value.trim() !== '')
}

const feedMeta = computed(() => {
  const hasName = hasText(item.dataFeedName)
  const hasDescription = hasText(item.dataFeedDescription)
  const hasFeed = hasText(item.dataFeed)
  const useFallback = !hasName && hasDescription && hasFeed

  return {
    label: useFallback ? 'Data feed' : 'Data feed name',
    value: useFallback ? item.dataFeed : item.dataFeedName,
    showTooltip: hasDescription && (hasName || useFallback),
  }
})
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
