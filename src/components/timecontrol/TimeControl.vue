<template>
  <v-menu
    left
    bottom
    :close-on-content-click="false"
    class="menu"
  >
    <template v-slot:activator="{ on, attrs }">
      <v-btn text v-bind="attrs" v-on="on">
        <v-icon>mdi-clock</v-icon>{{ now.toLocaleTimeString('en-UK', { hour: '2-digit', minute: '2-digit', timeZoneName : 'short' }) }}
      </v-btn>
    </template>
    <v-card min-width="500">
      <v-card-title>Time range</v-card-title>
      <v-card-text>
        <v-row align="start">
          <v-col>
            <DateTimeSelector
              v-model="startDateTime"
              label="From"
              prepend-date-icon="mdi-calendar-start"
              prepend-time-icon="mdi-clock-start"
              @input="storeIntervalFromDateTimes"
            />
            <DateTimeSelector
              v-model="endDateTime"
              label="To"
              prepend-date-icon="mdi-calendar-end"
              prepend-time-icon="mdi-clock-end"
              @input="storeIntervalFromDateTimes"
            />
          </v-col>
          <v-col>
            <IntervalSelector
              ref="intervalSelector"
              v-model="selectedInterval"
              :items="intervalItems"
              :now="now"
              @input="storeIntervalFromIntervalString"
            />
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="12">
            <span>Browser time:</span>
            <v-chip small>
              {{ now.toLocaleTimeString('en-UK', { hour: '2-digit', minute: '2-digit', timeZoneName : 'short' }) }}
            </v-chip>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </v-menu>
</template>


<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { Duration, DateTime } from 'luxon'
import { namespace } from 'vuex-class';

import DateTimeSelector from '@/components/timecontrol/DateTimeSelector.vue'
import IntervalSelector from '@/components/timecontrol/IntervalSelector.vue'

const sytemTimeModule = namespace('systemTime')

@Component({
  components: {
    DateTimeSelector,
    IntervalSelector
  }
})
export default class TimeControl extends Vue {
  @sytemTimeModule.State('systemTime')
  now!: Date

  @sytemTimeModule.Getter('getSystemTime')
  getSystemTime!: () => Date

  @sytemTimeModule.Mutation('setInterval')
  storeSetInterval!: (payload: any) => Date

  selectedInterval: string | null = 'default'
  intervalItems = [
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

  startDateTime: Date | null = null
  endDateTime: Date | null = null

  storeIntervalFromIntervalString() {
    if (!this.selectedInterval) return

    // If we set the interval, set the absolute dates to null.
    this.startDateTime = null
    this.endDateTime = null
    if (this.selectedInterval === 'default') {
      // Use the FEWS default time interval.
      this.storeSetInterval({
        startTime: null,
        endTime: null
      })
    } else {
      const duration = Duration.fromISO(this.selectedInterval)
      const start = DateTime.fromJSDate(this.now).plus(duration)
      const end = DateTime.fromJSDate(this.now)
      this.storeSetInterval({
        startTime: start.toJSDate(),
        endTime: end.toJSDate()
      })
    }
  }

  storeIntervalFromDateTimes(): void {
    if (!this.startDateTime && !this.endDateTime) return

    // Set the interval to null if we specify an absolute date range.
    this.selectedInterval = null

    // Set a default end datetime 1 day ahead of the start datetime if the end time is not yet
    // filled in, or a default start datetime 1 day before the end datetime if the start datetime
    // is not yet filled in.
    const oneDay = Duration.fromISO('P1D')
    if (this.startDateTime && !this.endDateTime) {
      this.endDateTime = DateTime
        .fromJSDate(this.startDateTime)
        .plus(oneDay)
        .toJSDate()
    }
    if (!this.startDateTime && this.endDateTime) {
      this.startDateTime = DateTime
        .fromJSDate(this.endDateTime)
        .minus(oneDay)
        .toJSDate()
    }

    this.storeSetInterval({
      startTime: this.startDateTime,
      endTime: this.endDateTime
    })
  }
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
