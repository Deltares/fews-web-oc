<template>
  <!-- A menu, or a fullscreen dialog on phones -->
  <component
    :is="isFullscreen ? VDialog : VMenu"
    v-model="isOpen"
    v-bind="overlayProps"
    :class="{ menu: !isFullscreen }"
  >
    <template v-slot:activator="{ props, isActive }">
      <div class="icon-group" v-bind="props">
        <div class="icon-group__underlay"></div>
        <v-tooltip
          :text="periodTooltip"
          :disabled="!periodTooltip"
          location="bottom"
        >
          <template #activator="{ props: tooltipProps }">
            <span
              v-bind="tooltipProps"
              class="systemtime-status systemtime-status--running"
              :aria-label="periodTooltip ?? 'System time mode'"
            >
              <v-icon class="systemtime-status__icon" :icon="periodIcon" />
              <span
                class="systemtime-status__dot"
                :class="{ 'systemtime-status__dot--pulse': syncPulseActive }"
                :style="runningDotStyle"
              ></span>
            </span>
          </template>
        </v-tooltip>
        <v-tooltip
          :text="otherTimeZoneTooltip"
          :disabled="!otherTimeZoneTooltip"
          location="bottom"
        >
          <template #activator="{ props: tooltipProps }">
            <span v-bind="tooltipProps" class="icon-group__label">
              <!-- Dashed when not in the browser time zone -->
              <span
                :class="{
                  'other-time-zone': otherTimeZoneTooltip && !timeZoneLabel,
                }"
              >
                {{ systemTimeLabel }}
              </span>
              <span
                v-if="timeZoneLabel"
                class="ms-1"
                :class="{ 'other-time-zone': otherTimeZoneTooltip }"
              >
                {{ timeZoneLabel }}
              </span>
            </span>
          </template>
        </v-tooltip>
        <v-btn icon size="small" class="last-btn">
          <v-icon>{{
            isActive ? 'mdi-chevron-up' : 'mdi-chevron-down'
          }}</v-icon>
        </v-btn>
      </div>
    </template>

    <v-card
      class="time-control-card d-flex flex-column"
      :class="{ 'time-control-card--menu': !isFullscreen }"
      :width="isFullscreen ? undefined : 560"
    >
      <!-- Like the toolbar of the user settings dialog -->
      <v-toolbar
        v-if="isFullscreen"
        :title="t('timeControl.title')"
        density="compact"
      >
        <v-btn
          size="small"
          icon
          :aria-label="t('timeControl.close')"
          @click="isOpen = false"
        >
          <v-icon size="small">mdi-close</v-icon>
        </v-btn>
      </v-toolbar>
      <div class="flex-grow-1 overflow-y-auto">
        <v-row no-gutters>
          <v-col cols="12" sm :class="smAndUp ? 'border-e' : 'border-b'">
            <interval-selector
              v-model="store.selectedInterval"
              :items="intervalItems"
              :now="store.systemTime"
              :selected-description="periodDescription"
            />
          </v-col>
          <v-col cols="12" sm="auto" :class="{ 'picker-column': smAndUp }">
            <div class="d-flex justify-center px-4 pt-3">
              <v-btn-toggle
                v-model="pickerUnit"
                mandatory
                density="compact"
                variant="outlined"
                divided
                rounded="lg"
                class="picker-unit-toggle"
              >
                <v-btn value="day" size="small">{{
                  t('timeControl.days')
                }}</v-btn>
                <v-btn value="month" size="small">
                  {{ t('timeControl.months') }}
                </v-btn>
                <v-btn value="year" size="small">{{
                  t('timeControl.years')
                }}</v-btn>
              </v-btn-toggle>
            </div>
            <period-range-picker
              :model-value="pickerDays"
              @update:model-value="onPickerUpdate"
              :unit="pickerUnit"
              :anchor="calendarAnchor"
              :now="toWallClockDate(store.systemTime)"
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
          >
            <template #selection="{ item }">
              <span class="text-truncate">
                {{ item.title }}
                <span class="text-medium-emphasis ms-2">
                  {{ timeZoneDetails.offset }}
                </span>
              </span>
            </template>
          </v-select>

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
            <span
              >{{ t('timeControl.syncFailed') }}: {{ store.syncError }}</span
            >
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
      </div>
    </v-card>
  </component>
</template>

<script setup lang="ts">
import { ref, computed, watchEffect, watch } from 'vue'
import { VDialog, VMenu } from 'vuetify/components'
import IntervalSelector from './IntervalSelector.vue'
import PeriodRangePicker from './PeriodRangePicker.vue'
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
import {
  intervalToDateRange,
  periodPresetToIntervalItem,
} from '@/lib/TimeControl/interval'
import {
  formatPeriodDuration,
  formatPeriodRange,
  getPeriodPrecision,
  type PeriodPrecision,
} from '@/lib/TimeControl/periodLabel'
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

const isOpen = ref(false)
const isFullscreen = computed(() => !smAndUp.value)
const overlayProps = computed(() =>
  isFullscreen.value
    ? { fullscreen: true, transition: 'dialog-bottom-transition' }
    : { closeOnContentClick: false },
)

const intervalItems = computed(() => {
  const presets = configStore.general.timeSettings?.viewPeriodPresets
  return presets?.map(periodPresetToIntervalItem) ?? []
})

// First and last day of the period in the date picker, as wall-clock dates,
// as the picker works in local time. The last day is included in the period.
const pickerDays = ref<Date[]>([])
const pickerUnit = ref<'day' | 'month' | 'year'>('day')
const DAY_IN_MS = 24 * 60 * 60 * 1000

// Show presets in the calendar mode that fits the length of their period, as
// presets are defined in units up to weeks, e.g. the last year as 52 weeks
watch(
  () => store.selectedInterval,
  (interval) => {
    if (typeof interval !== 'object') return
    // A preset without a start or end is open until or from the system time
    const [start = store.systemTime, end = store.systemTime] =
      intervalToDateRange(interval, store.systemTime)
    pickerUnit.value = getPickerUnit(start, end)
  },
  { immediate: true },
)

function getPickerUnit(start: Date, end: Date): 'day' | 'month' | 'year' {
  const days = Math.abs(end.getTime() - start.getTime()) / DAY_IN_MS
  if (days <= 62) return 'day'
  if (days <= 3 * 366) return 'month'
  return 'year'
}

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

  return d(store.systemTime, 'timeControl__mobile')
})

// The short name of the display time zone, e.g. CET, not on mobile
const timeZoneLabel = computed(() => {
  if (mobile.value || !isBackendSynced.value) return undefined
  return systemTimeDetails.value.timeZone
})

// Explains the dashed time zone, when it is not the browser time zone
const otherTimeZoneTooltip = computed(() => {
  const browser = browserTimeZoneDetails.value
  if (!browser) return undefined
  return `${t('timeControl.browserTimeZone')}: ${browser.name} (${browser.offset})`
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

// The end of the period, exclusive. A custom period ends at the end of its
// last day, so it ends at the start of the next day.
const periodEnd = computed(() => {
  const { endTime } = store
  if (!endTime) return undefined
  return isCustomInterval.value ? new Date(endTime.getTime() + 1) : endTime
})

const periodLabel = computed(() => {
  const { startTime } = store
  const endTime = periodEnd.value
  if (store.selectedInterval === 'default' || (!startTime && !endTime)) {
    return t('timeControl.defaultPeriod')
  }
  if (startTime && endTime) {
    // Presets are shown with the detail that fits their length
    const precision = isCustomInterval.value
      ? getPeriodPrecision(startTime, endTime)
      : getPresetPrecision(startTime, endTime)
    return formatPeriodRange(
      startTime,
      endTime,
      locale.value,
      precision,
      store.systemTime,
    )
  }
  const format = (date: Date) =>
    toDisplayDateTime(date)
      .setLocale(locale.value)
      .toLocaleString(DateTime.DATETIME_MED)
  return `${startTime ? format(startTime) : '…'} – ${endTime ? format(endTime) : '…'}`
})

function getPresetPrecision(start: Date, end: Date): PeriodPrecision {
  const days = (end.getTime() - start.getTime()) / DAY_IN_MS
  if (days < 2) return 'time'
  if (days <= 62) return 'day'
  return 'month'
}

const periodDescription = computed(() =>
  periodDuration.value
    ? `${periodLabel.value} · ${periodDuration.value}`
    : periodLabel.value,
)

// Only for custom periods, as the label of a preset tells its length
const periodDuration = computed(() => {
  const { startTime } = store
  const endTime = periodEnd.value
  if (!isCustomInterval.value || !startTime || !endTime) return
  return formatPeriodDuration(startTime, endTime, locale.value)
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

// The icons of the period list, for the default, custom or preset period
const periodIcon = computed(() => {
  if (isCustomInterval.value) return 'mdi-calendar-range'
  return store.isRunningWindow ? 'mdi-update' : 'mdi-clock-outline'
})

const periodTooltip = computed(() => {
  if (isCustomInterval.value) {
    return `${t('common.custom')}: ${periodDescription.value}`
  }
  return runningWindowTooltip.value
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

// Show the end of a default or preset period in the calendar, e.g. the
// current month for the last 6 months. Custom periods show where they start.
const calendarAnchor = computed(() =>
  isCustomInterval.value ? undefined : pickerDays.value.at(-1),
)

function toPickerDay(date: Date): Date {
  return toWallClockDate(toDisplayDateTime(date).startOf('day').toJSDate())
}

function onPickerUpdate(days: Date[]) {
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

.other-time-zone {
  text-decoration: underline dashed;
  text-underline-offset: 4px;
}

.time-control-card--menu {
  max-width: calc(100vw - 16px);
  max-height: calc(100dvh - 72px);
}

/* Narrow calendars, the period list takes the remaining width */
.picker-column {
  width: 280px;
}

.picker-unit-toggle {
  height: 28px;
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
  pointer-events: none; /* let the label get hover for its tooltip */
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
