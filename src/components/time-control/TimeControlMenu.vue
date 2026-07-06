<template>
  <v-menu left bottom :close-on-content-click="false" class="menu">
    <template v-slot:activator="{ props, isActive }">
      <div class="icon-group" v-bind="props">
        <div class="icon-group__underlay"></div>
        <span
          class="systemtime-status"
          :class="{ 'systemtime-status--running': isRunningMode }"
          :title="modeLabel"
          aria-label="System time mode"
        >
          <v-icon class="systemtime-status__icon">{{ modeIcon }}</v-icon>
          <span
            class="systemtime-status__dot"
            :class="{ 'systemtime-status__dot--pulse': syncPulseActive }"
            :style="runningDotStyle"
          ></span>
        </span>
        <span class="icon-group__label">
          {{ systemTimeLabel }}
        </span>
        <v-btn icon size="small" class="last-btn">
          <v-icon>{{
            isActive ? 'mdi-chevron-up' : 'mdi-chevron-down'
          }}</v-icon>
        </v-btn>
      </div>
    </template>

    <v-card :style="{ width: '90vw', maxWidth: '500px' }">
      <v-row no-gutters>
        <v-col>
          <v-form ref="form">
            <div class="pa-4">
              <v-date-input
                v-model="customStartDate"
                :label="t('common.start')"
                density="compact"
                variant="solo-filled"
                flat
                :rules="[
                  () =>
                    dateOrderIsCorrect ||
                    t('timeControl.startDateBeforeEndDate'),
                ]"
              />
              <v-date-input
                v-model="customEndDate"
                :label="t('common.end')"
                density="compact"
                variant="solo-filled"
                flat
                :rules="[
                  () =>
                    dateOrderIsCorrect ||
                    t('timeControl.endDateAfterStartDate'),
                ]"
              />
            </div>
          </v-form>
        </v-col>
        <v-col>
          <interval-selector
            ref="intervalSelector"
            v-model="store.selectedInterval"
            :items="intervalItems"
            :now="store.systemTime"
            @update:modelValue="onIntervalChange"
          />
        </v-col>
      </v-row>
      <v-card-actions>
        <span>Basis:</span>
        <v-chip small>
          {{ store.timeBasis }}
        </v-chip>
        <span>Update:</span>
        <v-chip small>
          {{ store.updatePattern }}
        </v-chip>
      </v-card-actions>
    </v-card>
  </v-menu>
</template>

<script setup lang="ts">
import { ref, computed, watchEffect, watch } from 'vue'
import IntervalSelector from './IntervalSelector.vue'
import type { VForm } from 'vuetify/components'
import { useI18n } from 'vue-i18n'
import { useDisplay } from 'vuetify'

import { CLOCK_TICK_MS, useSystemTimeStore } from '@/stores/systemTime'
import { useConfigStore } from '@/stores/config'
import { periodPresetToIntervalItem } from '@/lib/TimeControl/interval'

const { t, d } = useI18n()

const store = useSystemTimeStore()
const configStore = useConfigStore()
const { mobile } = useDisplay()

const form = ref<VForm>()

const dateOrderIsCorrect = computed(
  () =>
    !customStartDate.value ||
    !customEndDate.value ||
    customStartDate.value < customEndDate.value,
)

const intervalItems = computed(() => {
  const presets = configStore.general.timeSettings?.viewPeriodPresets
  return presets?.map(periodPresetToIntervalItem) ?? []
})

const customStartDate = ref<Date>()
const customEndDate = ref<Date>()
const syncPulseActive = ref(false)
let syncPulseTimeout: ReturnType<typeof setTimeout> | undefined

const isCustomInterval = computed(() => store.selectedInterval === 'custom')
const isBackendSynced = computed(
  () => store.lastSyncedAt !== undefined && store.syncError === undefined,
)

const systemTimeLabel = computed(() => {
  if (!isBackendSynced.value) {
    return '--:--'
  }

  return mobile.value
    ? d(store.systemTime, 'timeControl__mobile')
    : d(store.systemTime, 'timeControl')
})

const isRunningMode = computed(() => store.updatePattern !== 'static')

const runningDotStyle = computed(() => ({
  animationDuration: `${CLOCK_TICK_MS}ms`,
}))

const modeIcon = computed(() => {
  if (store.updatePattern === 'static') {
    return 'mdi-clock-outline'
  }

  if (store.timeBasis === 'offset') {
    if (store.updatePattern === 'step') {
      return 'mdi-clock-edit-outline'
    }
    return 'mdi-clock-plus-outline'
  }

  if (store.updatePattern === 'step') {
    return 'mdi-clock-time-eight-outline'
  }

  return 'mdi-clock-outline'
})

const modeLabel = computed(() => {
  if (store.updatePattern === 'static') {
    return `System time mode: ${store.timeBasis}, static`
  }

  if (store.updatePattern === 'step') {
    return `System time mode: ${store.timeBasis}, step`
  }

  return `System time mode: ${store.timeBasis}, continuous`
})

watchEffect(() => {
  if (isCustomInterval.value && dateOrderIsCorrect.value) {
    store.startTime = customStartDate.value
    store.endTime = customEndDate.value
  }
})

watch([customStartDate, customEndDate], () => {
  store.selectedInterval = 'custom'
  form.value?.validate()
})

watch(
  () => store.lastSyncedAt?.getTime(),
  (newVal, oldVal) => {
    if (newVal === undefined || newVal === oldVal) return
    syncPulseActive.value = false
    if (syncPulseTimeout) {
      clearTimeout(syncPulseTimeout)
      syncPulseTimeout = undefined
    }

    syncPulseTimeout = setTimeout(() => {
      syncPulseActive.value = true
      syncPulseTimeout = setTimeout(() => {
        syncPulseActive.value = false
        syncPulseTimeout = undefined
      }, 700)
    }, 0)
  },
)

function onIntervalChange() {
  store.changeInterval()
}
</script>
<style scoped>
.menu {
  position: relative;
  z-index: 10000;
}

.icon-group {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  position: relative;
  border-radius: 24px;
}

.systemtime-status {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  margin-left: 10px;
}

.systemtime-status__icon {
  opacity: 0.9;
}

.systemtime-status__dot {
  position: absolute;
  right: -1px;
  top: -1px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgb(var(--v-theme-primary));
  display: none;
}

.systemtime-status--running .systemtime-status__dot {
  display: block;
  animation-name: status-blink;
  animation-timing-function: ease-in-out;
  animation-iteration-count: infinite;
}

.systemtime-status__dot--pulse::after {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: 50%;
  border: 2px solid rgba(var(--v-theme-primary), 0.65);
  animation: sync-pulse 0.7s ease-out;
}

@keyframes status-blink {
  0%,
  45% {
    opacity: 1;
  }
  55%,
  100% {
    opacity: 0.2;
  }
}

@keyframes sync-pulse {
  0% {
    transform: scale(1);
    opacity: 0.9;
  }
  100% {
    transform: scale(2.5);
    opacity: 0;
  }
}

.icon-group__label {
  line-height: 40px;
  padding-left: 4px;
}

.icon-group__underlay {
  position: absolute;
  inset: 0; /* fill the container */
  border-radius: 20px;
  background-color: currentColor;
  opacity: var(--v-activated-opacity); /* hidden by default */
  transition: opacity 0.18s ease;
}

/* 1. Remove focus style from buttons */
.last-btn:focus {
  outline: none !important;
}

/* 2. Show focus outline on the *group* instead */
.icon-group:has(.last-btn:focus) {
  outline: 1px solid rgb(33, 150, 243) !important;
  outline: 2px solid var(--v-theme-primary);
  outline-offset: -1px;
}
</style>
