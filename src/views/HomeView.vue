<template>
  <v-card class="home-card">
    <v-card-title class="justify-center">
      Welcome to the Delft-FEWS Web OC!
    </v-card-title>
    <v-card-text v-if="menuItems.length>0">
      Select one of the following options to get started.
    </v-card-text>
    <v-card-text v-else>
      Unfortunately, you do not have access <v-icon>mdi-emoticon-sad-outline</v-icon>
    </v-card-text>
    <v-list dense style="margin:auto; width: fit-content;">
      <v-list-item v-for="item in menuItems" :key="item.id" :to="item.to">
        <v-list-item-icon>
          <v-icon>{{ item.icon }}</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
            {{ item.title }}
        </v-list-item-content>
      </v-list-item>
    </v-list>
  </v-card>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { namespace } from 'vuex-class'
import type { WebOcComponent } from '@/store/modules/fews-config/types'
import { ComponentTypeEnum } from '@/store/modules/fews-config/types'

const fewsConfigModule = namespace('fewsconfig')

@Component({})
export default class HomeView extends Vue {
  @fewsConfigModule.State('components')
    webOcComponents!: { [key: string]: WebOcComponent }
  @fewsConfigModule.Action('loadConfig')
    loadConfig!: () => void

  mounted(): void {
    this.loadConfig()
  }

  getMenuIcon (componentConfig: WebOcComponent): string {
    if (componentConfig.icon !== undefined) return componentConfig.icon
    switch (componentConfig.type) {
      case ComponentTypeEnum.DataViewer:
        return 'mdi-archive-search'
      case ComponentTypeEnum.SpatialDisplay:
        return 'mdi-map'
      case ComponentTypeEnum.SchematicStatusDisplay:
        return 'mdi-application-brackets-outline'
      case ComponentTypeEnum.TimeSeriesDisplay:
        return 'mdi-chart-sankey'
      case ComponentTypeEnum.SystemMonitor:
        return 'mdi-clipboard-list'
      default: return ''
    }
  }

  get menuItems (): {id: string, to: {name: string}, title: string, icon: string}[] {
    const menuItems = Object.values(this.webOcComponents).map(componentConfig => {
      return {
        id: componentConfig.id,
        to: { name: componentConfig.type },
        title: componentConfig.title ?? '',
        icon: this.getMenuIcon(componentConfig)
      }
    })
    return menuItems
  }
}
</script>

<style scoped>
  .home-card {
    margin: auto;
    margin-top: 5%;
    width: fit-content !important;
    height: fit-content !important;
  }
</style>
