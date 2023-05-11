<template>
  <v-menu
    left
    bottom
    :close-on-content-click="false"
    class="menu"
  >
    <template v-slot:activator="{ on, attrs }">
      <v-btn icon v-bind="attrs" v-on="on">
        <v-icon>mdi-clock</v-icon>
      </v-btn>
    </template>
    <v-card>
      <v-list>
        <v-list-item v-for="(item) in intervalItems" :key="item" @click="setInterval(item)">
          {{ localeString(item) }}
        </v-list-item>
        <v-list-item>
          Browser Time: {{ now.toLocaleTimeString('en-UK', { timeZoneName : 'short' }) }}
        </v-list-item>
      </v-list>
      <v-card-actions>
        <v-spacer />
        <v-btn plain>Reset</v-btn>
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

  intervalItems = [
    '-P1D',
    '-P7D',
  ]

  now = new Date()

  setInterval(interval: string) {
    const duration = Duration.fromISO(interval)
    const startDateTime = DateTime.fromJSDate(this.now).plus( duration)
    const endDateTime = DateTime.fromJSDate(this.now)
    this.$store.commit('systemTime/setInterval', { startTime: startDateTime.toJSDate(), endTime: endDateTime.toJSDate()})
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
