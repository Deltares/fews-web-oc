<template>
  <v-menu left bottom
    :close-on-content-click="false"
    class="menu"
  >
    <template v-slot:activator="{ on, attrs }">
      <v-btn icon v-bind="attrs" v-on="on">
        <v-icon>mdi-cog</v-icon>
      </v-btn>
    </template>
    <v-list>
      <v-subheader>Favorite settings</v-subheader>
      <v-list-item v-for="(s, i) of listFavorite" :key="i">
        <v-select v-if="s.type === 'oneOfMultiple'" :label="s.label" v-model="s.value" :items="s.items"
          outlined
          dense
          item-text="value"
          @change="onValueChange(s)"
          >
          <template v-slot:item="{ on, attrs, item}">
            <v-list-item
              v-bind="attrs"
              v-on="on"
            >
              <v-icon v-if="item.icon" small class="mr-5">{{ item.icon }}</v-icon>
              {{ item.value }}
            </v-list-item>
          </template>
        </v-select>
      </v-list-item>
      <v-divider />
      <v-list-item :to="{ name: 'UserSettingsView'}">All Settings</v-list-item>
      <v-list-item>
        <v-list-item-content>
          <v-list-item-title>Version {{ packageVersion }}</v-list-item-title>
        </v-list-item-content>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script lang="ts">
import {
  Component,
  Mixins
} from 'vue-property-decorator'
import ThemeMixin from '@/mixins/ThemeMixin'
import packageConfig from '../../package.json'

import { namespace } from 'vuex-class'
import { UserSettingsItem } from '@/store/modules/user-settings/types'
import "flag-icons/css/flag-icons.min.css"

const userSettingsModule = namespace('userSettings')

@Component
export default class CogMenu extends Mixins(ThemeMixin) {
  @userSettingsModule.Getter('listFavorite')
  listFavorite!: UserSettingsItem[]

  packageVersion = packageConfig.version
  items: UserSettingsItem[] = []

  created(): void {
    console.log(this.listFavorite)
    this.items = this.listFavorite
  }

  onValueChange(item: UserSettingsItem) {
    console.log(item)
  }
}
</script>

<style scoped>
.menu {
  position: relative;
  z-index: 10000;
}
</style>
