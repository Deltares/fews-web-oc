<template>
  <v-app id="app">
    <v-app-bar color="#080C80" dense app dark :clipped-left="!$vuetify.rtl" :clipped-right="$vuetify.rtl">
      <v-btn v-if="!$vuetify.breakpoint.mobile" text :to="{ name: 'Home' }" class="fews-home">
        Delft-FEWS Web OC
      </v-btn>
      <v-menu offset-y>
        <template v-slot:activator="{ on, attrs }">
        <v-app-bar-nav-icon
          aria-label="Menu button"
          v-bind="attrs"
          v-on="on"
        >
        </v-app-bar-nav-icon>
        </template>
        <v-list dense>
          <v-subheader>Switch to</v-subheader>
          <v-list-item v-for="item in menuItems" :key="item.id" :to="item.to">
            <v-list-item-icon>
              <v-icon>{{ item.icon }}</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
               {{ item.title }}
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </v-menu>
      <v-spacer />
      <TimeControl/>
      <CogMenu/>
      <login-component v-if="$config.authenticationIsEnabled"/>
    </v-app-bar>
    <v-navigation-drawer v-if="$route.meta.sidebar" v-model="drawer" app clipped hide-overlay :right="$vuetify.rtl" width="320"
      class="view-sidebar">
      <portal-target name="web-oc-sidebar" />
    </v-navigation-drawer>
    <v-main id="main">
      <router-view style="height: 100%;">
      </router-view>
      <v-btn v-if="$route.meta.sidebar && !($vuetify.breakpoint.mobile && drawer) " @click="toggleDrawer()" style="position: absolute; left: 0px; top: 5px; overflow: hidden-x; width: 30px; border-bottom-left-radius: 0px; border-top-left-radius: 0px; padding: 0px; min-width: 30px;">
        <v-icon aria-label="Menu button">{{ drawer ? 'mdi-chevron-left' : 'mdi-chevron-right' }} </v-icon>
      </v-btn>
      <div class="alert-div" v-if="showAlerts">
        <div v-for="alert in activeAlerts" v-bind:key="alert.id">
          <v-alert type="error" dismissible @input="(value) => dismissAlert(alert, value)">
            {{ alert.message }}
          </v-alert>
        </div>
      </div>
    </v-main>
  </v-app>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import CogMenu from '@/components/CogMenu.vue'
import TimeControl from '@/components/timecontrol/TimeControl.vue'
import LoginComponent from '@/components/LoginComponent.vue'
import { namespace } from 'vuex-class'
import { Alert } from '@/store/modules/alerts/types'
import type { WebOcComponent } from '@/store/modules/fews-config/types'
import { ComponentTypeEnum } from '@/store/modules/fews-config/types'

const alertsModule = namespace('alerts')
const fewsConfigModule = namespace('fewsconfig')

@Component({
  components: {
    CogMenu,
    LoginComponent,
    TimeControl,
  }
})
export default class Default extends Vue {
  @alertsModule.Getter('listActive')
    activeAlerts!: Alert[]
  @alertsModule.State('alerts')
    alerts!: Alert[]
  @fewsConfigModule.State('components')
    webOcComponents!: { [key: string]: WebOcComponent }
  @fewsConfigModule.Action('loadConfig')
    loadConfig!: () => void

  mounted(): void {
    this.loadConfig()
  }

  drawer: boolean | null = null

  toggleDrawer (): void {
    this.drawer = !this.drawer
  }

  get showAlerts() {
    return this.activeAlerts.length > 0
  }

  dismissAlert(alert: Alert, value: boolean) {
    alert.active = value
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

<style>
html, body {
  margin: 0px;
  overflow: hidden;
  height: 100%;
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  height: 100%;
  overflow: hidden;
}

.fews-home.v-btn {
  text-transform: capitalize !important;
}

#app.theme--light {
  background-color: rgba(240, 240, 240, 1);
  color: #2c3e50;
}

#main {
  height: 100%;
  overflow: hidden;
}

.router-container {
  padding: 0px;
  height: 100%;
}

.theme--light .view-sidebar {
  background-image: linear-gradient(to bottom, rgba(240, 240, 240, 1), rgba(240, 240, 240, 1));
}
</style>

<style scoped>
.alert-div
{
  position: absolute;
  margin: 0 auto;
  width: 80%;
  max-width: 100vw;
  bottom: 0px;
  right: 10%;
  z-index: 9000;
}
</style>
