<template>
  <v-menu left bottom :close-on-content-click="false" class="menu">
    <template v-slot:activator="{ props }">
      <v-btn v-bind="props" icon>
        <v-icon>mdi-clock-start</v-icon>
      </v-btn>
    </template>
    <v-card min-width="500">
      <v-card-title>Time range</v-card-title>
      <v-card-text>
        <v-row>
          <!-- <v-col>
            <DateTimeSelector v-model="startDateTime" label="From" prepend-date-icon="mdi-calendar-start"
              prepend-time-icon="mdi-clock-start" @input="storeIntervalFromDateTimes" />
            <DateTimeSelector v-model="endDateTime" label="To" prepend-date-icon="mdi-calendar-end"
              prepend-time-icon="mdi-clock-end" @input="storeIntervalFromDateTimes" />
          </v-col> -->
          <v-col>
            <interval-selector
              ref="intervalSelector"
              v-model="selectedInterval"
              :items="intervalItems"
              :now="store.systemTime"
            />
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="12">
            <span>Browser time:</span>
            <v-chip small>
              {{
                store.systemTime.toLocaleTimeString('en-UK', {
                  hour: '2-digit',
                  minute: '2-digit',
                  timeZoneName: 'short',
                })
              }}
            </v-chip>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </v-menu>
</template>

<script setup lang="ts">
// import { DateTime } from "luxon";
// import DateTimeSelector from "./DateTimeSelector.vue";
import IntervalSelector from './IntervalSelector.vue'

import { ref } from 'vue'
import { useSystemTimeStore } from '../../stores/systemTime'

const store = useSystemTimeStore()

let selectedInterval = ref<string>('default')
const intervalItems = [
  '-P1D',
  '-P2D',
  '-P3D',
  '-P4D',
  '-P5D',
  '-P6D',
  '-P7D',
  '-P2W',
  '-P3W',
  '-P1M',
]

// const startDateTime = DateTime.now();
// const endDateTime = DateTime.now();

// const storeIntervalFromDateTimes = () => {
//   storeSetInterval({
//     startDateTime,
//     endDateTime,
//   });
// };

// const storeIntervalFromIntervalString = () => {
//   storeSetInterval({
//     intervalString: selectedInterval,
//   });
// };
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
