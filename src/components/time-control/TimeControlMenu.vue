<template>
  <v-menu left bottom :close-on-content-click="false" class="menu">
    <template v-slot:activator="{ props }">
      <v-btn v-bind="props" icon>
        <v-icon>mdi-clock-start</v-icon>
      </v-btn>
    </template>

    <v-card width="500px">
      <v-row no-gutters>
        <v-col>
          <v-form
            v-model="datesAreValid"
            :disabled="store.selectedInterval !== 'custom'"
          >
            <v-card-actions>
              <v-text-field
                v-model="startDateString"
                label="Start"
                density="compact"
                variant="solo-filled"
                flat
                :rules="[rules.required, rules.date]"
              >
                <template v-slot:prepend>
                  <v-menu offset-y :close-on-content-click="false">
                    <template v-slot:activator="{ props }">
                      <v-icon v-bind="props">mdi-calendar-start</v-icon>
                    </template>
                    <v-date-picker v-model="startDates" no-title hide-actions>
                      <template #header></template>
                    </v-date-picker>
                  </v-menu>
                </template>
              </v-text-field>
            </v-card-actions>
            <v-card-actions>
              <v-text-field
                v-model="endDateString"
                label="End"
                density="compact"
                variant="solo-filled"
                flat
                :rules="[rules.required, rules.date]"
              >
                <template v-slot:prepend>
                  <v-menu offset-y :close-on-content-click="false">
                    <template v-slot:activator="{ props }">
                      <v-icon v-bind="props">mdi-calendar-end</v-icon>
                    </template>
                    <v-date-picker v-model="endDates" no-title hide-actions>
                      <template #header></template>
                    </v-date-picker>
                  </v-menu>
                </template>
              </v-text-field>
            </v-card-actions>
          </v-form>
        </v-col>
        <!-- <v-col>
            <DateTimeSelector v-model="startDateTime" label="From" prepend-date-icon="mdi-calendar-start"
              prepend-time-icon="mdi-clock-start" @input="storeIntervalFromDateTimes" />
            <DateTimeSelector v-model="endDateTime" label="To" prepend-date-icon="mdi-calendar-end"
              prepend-time-icon="mdi-clock-end" @input="storeIntervalFromDateTimes" />
          </v-col> -->
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
// import DateTimeSelector from "./DateTimeSelector.vue";
import IntervalSelector from './IntervalSelector.vue'

import { ref, computed } from 'vue'
import { useSystemTimeStore } from '../../stores/systemTime'
import { DateTime } from 'luxon'

const store = useSystemTimeStore()
const datesAreValid = ref(true)
const DATE_FMT = 'yyyy-MM-dd'
const rules = {
  required: (value: string) => (value !== undefined && !!value) || 'Required',
  date: (value: string) => {
    const date = DateTime.fromFormat(value || '', DATE_FMT)
    return !isNaN(date.valueOf()) || 'Invalid date'
  },
}

const intervalItems = ['-PT12H', '-P1D', '-P1W', '-P2W', '-P1M']

const dates = ref<[Date, Date]>([new Date(), new Date()])

const startDates = computed({
  get() {
    return [dates.value[0]]
  },
  set(newValue: Date[]) {
    dates.value[0] = newValue[0]
  },
})

const endDates = computed({
  get() {
    return [dates.value[1]]
  },
  set(newValue: Date[]) {
    dates.value[1] = newValue[0]
  },
})

const startDateString = computed({
  get() {
    return DateTime.fromJSDate(dates.value[0]).toFormat(DATE_FMT)
  },
  set(newValue: string) {
    dates.value[0] = DateTime.fromFormat(newValue, DATE_FMT).toJSDate()
  },
})

const endDateString = computed({
  get() {
    return DateTime.fromJSDate(dates.value[1]).toFormat(DATE_FMT)
  },
  set(newValue: string) {
    dates.value[1] = DateTime.fromFormat(newValue, DATE_FMT).toJSDate()
  },
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
