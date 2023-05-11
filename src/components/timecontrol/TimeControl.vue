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
    <v-card>
      <v-subheader>Time range</v-subheader>
      <v-list>
        <v-list-item @click="setInterval(null)">
          <v-list-item-title>
            Default
          </v-list-item-title>
          <v-list-item-icon>
              <v-icon v-show="selectedInterval === null" small>mdi-check</v-icon>
            </v-list-item-icon>
        </v-list-item>
        <v-list-item v-for="(item) in intervalItems" :key="item" @click="setInterval(item)">
          <v-list-item-title>
            {{ localeString(item) }}
            </v-list-item-title>
            <v-list-item-icon>
              <v-icon v-show="item === selectedInterval" small>mdi-check</v-icon>
            </v-list-item-icon>
        </v-list-item>
      </v-list>
      <v-divider />
      <v-card-actions>
        <span class="mr-2">Browser time:</span>
        <v-chip small>{{ now.toLocaleTimeString('en-UK', { hour: '2-digit', minute: '2-digit', timeZoneName : 'short' }) }}</v-chip>
      </v-card-actions>
    </v-card>
  </v-menu>
</template>


<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { Duration, DateTime } from 'luxon'
import { namespace } from 'vuex-class';

const sytemTimeModule = namespace('systemTime')

@Component
export default class TimeControl extends Vue {
  @sytemTimeModule.State('systemTime')
  now!: Date

  @sytemTimeModule.Getter('getSystemTime')
  getSystemTime!: () => Date

  @sytemTimeModule.Mutation('setInterval')
  storeSetInterval!: (payload: any) => Date

  selectedInterval: string|null = null
  intervalItems = [
    '-P1D',
    '-P7D',
  ]

  setInterval(interval: string | null) {
    const now = this.getSystemTime()
    this.selectedInterval = interval
    if (interval == null) {
      this.storeSetInterval({ startTime: null, endTime: null})
    } else {
      const duration = Duration.fromISO(interval)
      const startDateTime = DateTime.fromJSDate(now).plus( duration)
      const endDateTime = DateTime.fromJSDate(now)
      this.storeSetInterval({ startTime: startDateTime.toJSDate(), endTime: endDateTime.toJSDate()})
    }
  }

  localeString(item: string) {
    const duration = Duration.fromISO(item)
    const startDateTime = DateTime.fromJSDate(this.now).plus( duration)
    return startDateTime.toRelative()
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
