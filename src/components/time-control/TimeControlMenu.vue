<template>
  <v-menu left bottom :close-on-content-click="false" class="menu">
    <template v-slot:activator="{ props, isActive }">
      <div class="icon-group" v-bind="props">
        <div class="icon-group__underlay"></div>
        <span class="icon-group__label">
          {{ d(store.systemTime, 'timeControlMenu__appBar') }}
        </span>
        <v-btn icon size="small" class="last-btn">
          <v-icon size="large">{{
            isActive ? 'mdi-chevron-up' : 'mdi-chevron-down'
          }}</v-icon>
        </v-btn>
      </div>
    </template>

    <v-card width="500px">
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
        <span>{{ t('timeControl.browserTime') }}</span>
        <v-chip small>
          {{ d(new Date(), 'timeControlMenu__browserTime') }}
        </v-chip>
      </v-card-actions>
    </v-card>
  </v-menu>
</template>

<script setup lang="ts">
import IntervalSelector from './IntervalSelector.vue'
import { VDateInput } from 'vuetify/labs/components'
import type { VForm } from 'vuetify/components'

import { ref, computed, watchEffect, watch } from 'vue'
import { useSystemTimeStore } from '@/stores/systemTime'
import { useConfigStore } from '@/stores/config'
import { periodPresetToIntervalItem } from '@/lib/TimeControl/interval'
import { useI18n } from 'vue-i18n'

const { t, d } = useI18n()

const store = useSystemTimeStore()
const configStore = useConfigStore()

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

const isCustomInterval = computed(() => store.selectedInterval === 'custom')

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

function onIntervalChange() {
  store.changeInterval()
}
</script>
<style>
.menu {
  position: relative;
  z-index: 10000;
}

input {
  width: 100%;
  color: white;
}

.icon-group {
  display: inline-flex;
  position: relative;
  border-radius: 24px;
}

.icon-group__label {
  line-height: 40px;
  padding-left: 15px;
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
