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
import { namespace } from 'vuex-class'
import { UserSettingsItem } from '@/store/modules/user-settings/types'

const userSettingsModule = namespace('userSettings')

@Component
export default class DataView extends Vue {
  @userSettingsModule.State('groups')
  groups!: string[]

  @userSettingsModule.Getter('settingsForGroup')
  settingsForGroup!: (id: string) => UserSettingsItem[]
}
</script>

<style scoped>
</style>
