<template>
  <v-menu left bottom :close-on-content-click="false" class="menu">
    <template v-slot:activator="{ props, isActive }">
      <v-btn v-bind="props" variant="tonal" rounded>
        {{
          Intl.DateTimeFormat('nl', {
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
          <v-form
            v-model="datesAreValid"
            :disabled="store.selectedInterval !== 'custom'"
          >
            <div class="pa-4">
              <v-date-input
                v-model="customStartDate"
                :disabled="store.selectedInterval !== 'custom'"
                label="Start"
                density="compact"
                variant="solo-filled"
                flat
              />
              <v-date-input
                v-model="customEndDate"
                :disabled="store.selectedInterval !== 'custom'"
                label="End"
                density="compact"
                variant="solo-filled"
                flat
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
        <span>Browser time:</span>
        <v-chip small>
          {{
            Intl.DateTimeFormat('nl', {
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

import { ref, computed, watchEffect } from 'vue'
import { useSystemTimeStore } from '../../stores/systemTime'
import { useConfigStore } from '@/stores/config'
import { periodPresetToIntervalItem } from '@/lib/TimeControl/interval'

const store = useSystemTimeStore()
const configStore = useConfigStore()
const datesAreValid = ref(true)

const intervalItems = computed(() => {
  const presets = configStore.general.timeSettings?.viewPeriodPresets
  return presets?.map(periodPresetToIntervalItem) ?? []
})

const customStartDate = ref<Date>()
const customEndDate = ref<Date>()

watchEffect(() => {
  if (store.selectedInterval === 'custom') {
    store.startTime = customStartDate.value
    store.endTime = customEndDate.value
  }
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
