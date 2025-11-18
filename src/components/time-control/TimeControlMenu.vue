<template>
  <v-menu left bottom :close-on-content-click="false" class="menu">
    <template v-slot:activator="{ props, isActive }">
      <v-btn v-bind="props" variant="tonal" rounded>
        {{
          Intl.DateTimeFormat(t('locale'), {
            hour: '2-digit',
            minute: '2-digit',
            timeZoneName: 'short',
          }).format(store.systemTime)
        }}
        <v-icon>{{ isActive ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
      </v-btn>
    </template>

    <v-card width="500px">
      <v-row no-gutters>
        <v-col>
          <v-form ref="form">
            <div class="pa-4">
              <v-date-input
                v-model="customStartDate"
                :label="t('start')"
                density="compact"
                variant="solo-filled"
                flat
                :rules="[
                  () => dateOrderIsCorrect || t('startDateBeforeEndDate'),
                ]"
              />
              <v-date-input
                v-model="customEndDate"
                :label="t('end')"
                density="compact"
                variant="solo-filled"
                flat
                :rules="[
                  () => dateOrderIsCorrect || t('EndDateAfterStartDate'),
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
        <span>{{ t('browser_time') }}</span>
        <v-chip small>
          {{
            Intl.DateTimeFormat('de', {
              hour: '2-digit',
              minute: '2-digit',
              timeZoneName: 'short',
            }).format(store.systemTime)
          }}
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

const { t } = useI18n()

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
</style>
