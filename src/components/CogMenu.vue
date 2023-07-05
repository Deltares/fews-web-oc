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
      <v-list-item dense v-for="(s, i) of listFavorite" :key="i">
        <v-list-item-content>
        <template  v-if="s.type === 'oneOfMultiple'">
        <v-list-item-title>{{ s.label }}</v-list-item-title>
        <v-btn-toggle dense v-model="s.value" @change="onValueChange(s)"
>
          <v-btn v-for="item of s.items" :key="item.value" :value="item.value" :disabled="item.disabled">
            <v-icon v-if="item.icon">{{ item.icon }}</v-icon>
            <span v-else>{{ item.value }}</span>
          </v-btn>
        </v-btn-toggle>
        </template>
        <!-- <v-select v-if="s.type === 'oneOfMultiple'" :label="s.label" v-model="s.value" :items="s.items"
          outlined
          dense
          item-text="value"
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
        </v-select> -->
        <v-switch dense inset v-else-if="s.type === 'boolean'" v-model="s.value" :label="s.label" :disabled="s.disabled"
          @change="onValueChange(s)">
        </v-switch>
        </v-list-item-content>
      </v-list-item>
      <v-divider />
      <v-list-item :to="{ name: 'UserSettingsView'}">All Settings</v-list-item>
    </v-list>
  </v-menu>
</template>

<script lang="ts">
import {
  Component,
  Vue
} from 'vue-property-decorator'

import { namespace } from 'vuex-class'
import { UserSettingsItem } from '@/store/modules/user-settings/types'
import "flag-icons/css/flag-icons.min.css"

const userSettingsModule = namespace('userSettings')

@Component
export default class CogMenu extends Vue {
  @userSettingsModule.Getter('listFavorite')
  listFavorite!: UserSettingsItem[]
  @userSettingsModule.Mutation('add')
  addUserSetting!: (item: UserSettingsItem) => void

  items: UserSettingsItem[] = []

  created(): void {
    console.log(this.listFavorite)
    this.items = this.listFavorite
  }

  onValueChange(item: UserSettingsItem) {
    this.addUserSetting(item)
  }
}
</script>

<style scoped>
.menu {
  position: relative;
  z-index: 10000;
}
</style>
