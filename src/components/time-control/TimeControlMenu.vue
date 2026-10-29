<template>
  <v-menu left bottom :close-on-content-click="false" class="menu">
    <template v-slot:activator="{ props, isActive }">
      <div class="icon-group" v-bind="props">
        <div class="icon-group__underlay"></div>
        <v-tooltip
          :text="runningWindowTooltip"
          :disabled="!runningWindowTooltip"
        >
          <template #activator="{ props: tooltipProps }">
            <span
              v-bind="tooltipProps"
              class="systemtime-status systemtime-status--running"
              :aria-label="runningWindowTooltip ?? 'System time mode'"
            >
              <v-icon
                class="systemtime-status__icon"
                :icon="
                  runningWindowTooltip ? 'mdi-update' : 'mdi-clock-outline'
                "
              />
              <span
                class="systemtime-status__dot"
                :class="{ 'systemtime-status__dot--pulse': syncPulseActive }"
                :style="runningDotStyle"
              ></span>
            </span>
          </template>
        </v-tooltip>
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

    <v-card class="time-control-card" :width="mobile ? undefined : 640">
      <v-row no-gutters>
        <v-col cols="12" sm="5" :class="smAndUp ? 'border-e' : 'border-b'">
          <interval-selector
            v-model="store.selectedInterval"
            :items="intervalItems"
            :now="store.systemTime"
          />
        </v-col>
        <v-col cols="12" sm="7">
          <div class="px-4 pt-3">
            <div class="text-body-2 text-medium-emphasis">
              {{ t('timeControl.selectedPeriod') }}
            </div>
            <div class="text-body-2">{{ periodLabel }}</div>
            <div
              v-if="!isCustomInterval"
              class="text-caption text-medium-emphasis"
            >
              {{ t('timeControl.pickCustomPeriod') }}
            </div>
          </div>
          <v-date-picker
            :model-value="pickerDays"
            @update:model-value="onPickerUpdate"
            multiple="range"
            hide-header
            show-adjacent-months
            weeks-in-month="dynamic"
            control-height="40"
            width="100%"
            class="compact-date-picker"
            :aria-label="t('timeControl.period')"
          />
        </v-col>
      </v-row>

      <v-divider />

      <div class="pa-4 time-control-info">
        <div class="d-flex flex-wrap align-baseline gc-3 text-body-1">
          <span>{{ systemTimeDetails.date }}</span>
          <span>
            <span class="running-clock">{{ systemTimeDetails.time }}</span>
            <span class="text-medium-emphasis ms-1">
              {{ systemTimeDetails.timeZone }}
            </span>
          </span>
        </div>

        <v-select
          v-if="timeZoneSetting"
          :model-value="timeZoneSetting.value"
          @update:model-value="onTimeZoneUpdate"
          :items="timeZoneOptions"
          :label="t('timeControl.timeZone')"
          :disabled="timeZoneSetting.disabled"
          item-title="title"
          item-value="value"
          prepend-inner-icon="mdi-earth"
          variant="solo-filled"
          density="compact"
          flat
          item-props
          hide-details
        />
        <div class="text-caption text-medium-emphasis">
          {{ timeZoneDetails.offset }} · {{ timeZoneDetails.longName }}
        </div>

        <div
          v-if="browserTimeZoneDetails"
          class="time-control-info__row text-caption text-medium-emphasis"
        >
          <v-icon size="small" icon="mdi-web" />
          <span>
            {{ t('timeControl.browserTimeZone') }}:
            {{ browserTimeZoneDetails.name }}
            ({{ browserTimeZoneDetails.offset }})
          </span>
        </div>
        <div
          v-if="store.syncError"
          class="time-control-info__row text-caption text-warning"
        >
          <v-icon size="small" icon="mdi-sync-alert" />
          <span>{{ t('timeControl.syncFailed') }}: {{ store.syncError }}</span>
        </div>
        <div
          v-else-if="lastSyncedLabel"
          class="time-control-info__row text-caption text-medium-emphasis"
        >
          <v-icon size="small" icon="mdi-sync" />
          <span>{{
            t('timeControl.lastSynced', { time: lastSyncedLabel })
          }}</span>
          <v-tooltip :text="t('timeControl.syncHint')" max-width="320">
            <template #activator="{ props: tooltipProps }">
              <v-icon
                v-bind="tooltipProps"
                size="small"
                icon="mdi-information-outline"
                :aria-label="t('timeControl.syncHint')"
                tabindex="0"
              />
            </template>
          </v-tooltip>
        </div>
      </div>
    </v-card>
  </v-menu>
</template>

<script setup lang="ts">
import { ref, computed, watchEffect, watch } from 'vue'
import IntervalSelector from './IntervalSelector.vue'
import { useI18n } from 'vue-i18n'
import { useDisplayDateFormat } from '@/services/useDisplayDateFormat'
import { useDisplay } from 'vuetify'

import { CLOCK_TICK_MS, useSystemTimeStore } from '@/stores/systemTime'
import { useConfigStore } from '@/stores/config'
import {
  type UserSettingsItemOneOf,
  useUserSettingsStore,
} from '@/stores/userSettings'
import { useUserSettingTranslation } from '@/services/useUserSettingTranslation'
import { periodPresetToIntervalItem } from '@/lib/TimeControl/interval'
import { DateTime } from 'luxon'
import {
  fromWallClockDate,
  getDisplayTimeZone,
  SYSTEM_TIME_ZONE,
  toDisplayDateTime,
  toWallClockDate,
} from '@/lib/date/timeZone'

const { t, locale } = useI18n()
const { d } = useDisplayDateFormat()

const store = useSystemTimeStore()
const configStore = useConfigStore()
const userSettings = useUserSettingsStore()
const { optionTitle } = useUserSettingTranslation()
const { mobile, smAndUp } = useDisplay()

const intervalItems = computed(() => {
  const presets = configStore.general.timeSettings?.viewPeriodPresets
  return presets?.map(periodPresetToIntervalItem) ?? []
})

// First and last day of the period in the date picker, as wall-clock dates,
// as the picker works in local time. The last day is included in the period.
const pickerDays = ref<Date[]>([])
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

const systemTimeDetails = computed(() => {
  const dateTime = toDisplayDateTime(store.systemTime).setLocale(locale.value)
  return {
    date: dateTime.toLocaleString(DateTime.DATE_HUGE),
    time: dateTime.toLocaleString(DateTime.TIME_WITH_SECONDS),
    timeZone: dateTime.offsetNameShort ?? '',
  }
})

function getTimeZoneDetails(dateTime: DateTime) {
  return {
    name: dateTime.zoneName ?? '',
    longName: dateTime.offsetNameLong ?? '',
    offset: `UTC${dateTime.toFormat('ZZ')}`,
  }
}

const timeZoneDetails = computed(() =>
  getTimeZoneDetails(
    toDisplayDateTime(store.systemTime).setLocale(locale.value),
  ),
)

const timeZoneSetting = computed(() => {
  const setting = userSettings.get('ui.timeZone')
  return setting?.type === 'oneOfMultiple' ? setting : undefined
})

const timeZoneOptions = computed(() => {
  const setting = timeZoneSetting.value
  if (!setting) return []
  return setting.items.map((item) => {
    const isSystem = item.value === SYSTEM_TIME_ZONE
    const dateTime = DateTime.fromJSDate(store.systemTime, {
      zone: item.value,
    }).setLocale(locale.value)
    const title = optionTitle(setting, item)
    const details = dateTime.isValid ? getTimeZoneDetails(dateTime) : undefined
    return {
      value: item.value,
      disabled: item.disabled,
      title: isSystem && details ? `${title} (${details.name})` : title,
      subtitle: details ? `${details.offset} · ${details.longName}` : '',
    }
  })
})

function onTimeZoneUpdate(value: unknown) {
  if (typeof value !== 'string') return
  const setting = userSettings.items.find(
    (item): item is UserSettingsItemOneOf => item.id === 'ui.timeZone',
  )
  if (setting) userSettings.add({ ...setting, value })
}

const periodLabel = computed(() => {
  const { startTime, endTime } = store
  if (store.selectedInterval === 'default' || (!startTime && !endTime)) {
    return t('timeControl.defaultPeriod')
  }
  const format = (date: Date) =>
    toDisplayDateTime(date)
      .setLocale(locale.value)
      .toLocaleString(
        isCustomInterval.value ? DateTime.DATE_MED : DateTime.DATETIME_MED,
      )
  return `${startTime ? format(startTime) : '…'} – ${endTime ? format(endTime) : '…'}`
})

// The browser time zone, when dates are displayed in another time zone
const browserTimeZoneDetails = computed(() => {
  const dateTime = DateTime.fromJSDate(store.systemTime, {
    zone: 'system',
  }).setLocale(locale.value)
  if (dateTime.zoneName === timeZoneDetails.value.name) return undefined
  return getTimeZoneDetails(dateTime)
})

const lastSyncedLabel = computed(() => {
  if (!store.lastSyncedAt) return undefined
  return toDisplayDateTime(store.lastSyncedAt)
    .setLocale(locale.value)
    .toLocaleString(DateTime.TIME_WITH_SECONDS)
})

// Describes the preset period, which moves with the system time
const runningWindowTooltip = computed(() => {
  const interval = store.selectedInterval
  if (typeof interval !== 'object') return undefined
  const label =
    'label' in interval && typeof interval.label === 'string'
      ? interval.label
      : t('timeControl.runningWindow')
  return `${label}: ${t('timeControl.runningWindowHint')}`
})

const runningDotStyle = computed(() => ({
  animationDuration: `${CLOCK_TICK_MS}ms`,
}))

// Apply the custom period in the display time zone. A single picked day is a
// period of one day, until a second day is picked.
watchEffect(() => {
  if (!isCustomInterval.value) return
  const firstDay = pickerDays.value[0]
  const lastDay = pickerDays.value.at(-1)
  if (!firstDay || !lastDay) return
  store.startTime = fromWallClockDate(firstDay)
  store.endTime = toDisplayDateTime(fromWallClockDate(lastDay))
    .endOf('day')
    .toJSDate()
})

// Show the days of the default or preset period, none for the default
watch(
  () => [store.startTime, store.endTime, getDisplayTimeZone()],
  () => {
    if (isCustomInterval.value) return
    const { startTime, endTime } = store
    pickerDays.value =
      startTime && endTime
        ? [
            toPickerDay(startTime),
            // A period ending at midnight does not include the day it ends on
            toPickerDay(new Date(endTime.getTime() - 1)),
          ]
        : []
  },
  { immediate: true },
)

function toPickerDay(date: Date): Date {
  return toWallClockDate(toDisplayDateTime(date).startOf('day').toJSDate())
}

function onPickerUpdate(days: unknown) {
  // Picking the first day again clears the selection, keep that day instead
  if (!Array.isArray(days) || days.length === 0) return
  store.selectedInterval = 'custom'
  pickerDays.value = days
}

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

.time-control-card {
  max-width: calc(100vw - 16px);
  max-height: calc(100dvh - 72px);
  overflow-y: auto;
}

.compact-date-picker :deep(.v-date-picker-month) {
  padding-bottom: 4px;
}

.compact-date-picker :deep(.v-date-picker-month__day) {
  height: 32px;
  padding: 1px;
}

.compact-date-picker :deep(.v-date-picker-month__day .v-btn) {
  --v-btn-height: 20px;
  width: 30px;
  height: 30px;
}

.running-clock {
  font-variant-numeric: tabular-nums;
}

.time-control-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.time-control-info__row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.time-control-info__row > .v-icon {
  margin-top: 2px;
  opacity: 0.7;
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
