<template>
  <v-container>
    <div v-for="g in groups" :key="g">
      <h2>{{ g }}</h2>
      <v-row v-for="(s, i) of settingsForGroup(g)" :key="i" dense>
        <v-col cols="12" md="6">
          <v-select v-if="s.type === 'oneOfMultiple'" :label="s.label" v-model="s.value" :items="s.items" outlined dense>
          </v-select>
        </v-col>
      </v-row>
    </div>
  </v-container>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

@Component
export default class DataView extends Vue {
  value = 'm/s'
  settings = [
    { type: 'oneOfMultiple' , label: 'Wind speed', value: 'm/s', items: ['m/s', 'km/h', 'Bft', 'kts'], group: 'Units'},
    { type: 'oneOfMultiple',  label: 'Wind direction', value: 'degree', items: ['degree', 'cardinal'], group: 'Units'},
    { type: 'oneOfMultiple',  label: 'Theme', value: 'auto', items: ['auto', 'light', 'dark'], group: 'Theme'},
    { type: 'oneOfMultiple',  label: 'Language', value: 'en', items: ['en', 'nl'], group: 'Locale'},

  ]
  groups = ['Units', 'Theme', 'Locale']

  settingsForGroup(id: string) {
    return this.settings.filter((s) => s.group === id)
  }
}
</script>

<style scoped>
</style>
