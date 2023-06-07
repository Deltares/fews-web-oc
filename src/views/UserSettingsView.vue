<template>
  <v-container>
    <h1>Settings</h1>
    <div v-for="g in groups" :key="g">
      <h2>{{ g }}</h2>
      <v-row v-for="(s, i) of listByGroup(g)" :key="i" dense>
        <v-col cols="12" md="6">
          <v-select v-if="s.type === 'oneOfMultiple'" :label="s.label" v-model="s.value" :items="s.items"
            :append-outer-icon="s.favorite ? 'mdi-star' : 'mdi-star-outline'"
            outlined
            dense
            item-text="value"
            @change="onValueChange(s)"
            @click:append-outer="onFavoriteChange(s)"
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
        </v-col>
      </v-row>
    </div>
  </v-container>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { namespace } from 'vuex-class'
import { UserSettingsItem } from '@/store/modules/user-settings/types'
import "flag-icons/css/flag-icons.min.css";

const userSettingsModule = namespace('userSettings')

@Component
export default class DataView extends Vue {
  @userSettingsModule.State('groups')
  groups!: string[]
  @userSettingsModule.Getter('listByGroup')
  listByGroup!: (id: string) => UserSettingsItem[]
  @userSettingsModule.Mutation('add')
  addUserSetting!: (item: UserSettingsItem) => void

  onValueChange(item: UserSettingsItem) {
    this.addUserSetting(item)
  }

  onFavoriteChange(item: UserSettingsItem) {
    item.favorite = !item.favorite
    this.addUserSetting(item)
  }

}
</script>

<style scoped>
</style>
