<template>
  <v-app id="app">
    <v-app-bar color="#080C80" dense app dark>
      <v-app-bar-nav-icon @click="toggleDrawer()"></v-app-bar-nav-icon>
      <v-spacer />
      <div>{{ webOcTitle }}</div>
      <v-spacer />
      <CogMenu :multipleLanguages="false"/>
    </v-app-bar>
    <v-navigation-drawer v-model="drawer" app hide-overlay :right="$vuetify.rtl" width="320"
      class="view-sidebar">
      <v-toolbar dense fixed>
        <v-btn text :to="{ name: 'About' }" class="fews-home">
          <v-img width="148" :src="logo"></v-img>
        </v-btn>
        <v-spacer />
        <login-component v-if="$config.authenticationIsEnabled"/>
      </v-toolbar>
      <v-menu offset-y left min-width="320" v-if="(menuItems.length > 1)">

        <template v-slot:activator="{ on, attrs, value }">
        <v-list-item
          aria-label="Menu button"
          v-bind="attrs"
          v-on="on"
        >
          <v-list-item-content>{{ currentItemTitle }}</v-list-item-content>
          <v-list-item-icon><v-icon small>{{ value ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon></v-list-item-icon>
        </v-list-item>
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
      <portal-target name="web-oc-sidebar" />
    </v-navigation-drawer>
    <v-main id="main">
      <router-view style="height: 100%;">
      </router-view>
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
import {
  WebOcGeneralConfig
} from "@deltares/fews-pi-requests/lib/types/response/configuration/WebOcConfigurationResponse";
import {configManager} from "@/services/application-config";
import {authenticationManager} from "@/services/authentication/AuthenticationManager";
import {PiWebserviceProvider} from "@deltares/fews-pi-requests";

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
  @fewsConfigModule.State('general')
    webOcGeneral!: WebOcGeneralConfig

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
      case ComponentTypeEnum.MetocDataViewer:
        return 'mdi-flask-empty'
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

  get webOcTitle() {
    return this?.webOcGeneral?.title === undefined ? 'Delft-FEWS Web OC' : this.webOcGeneral.title
  }

  get currentItemTitle() {
    const matchedRouteNames = this.$route.matched.map( m => m.name )
    return this.menuItems.find(item => matchedRouteNames.includes(item.to.name))?.title ?? this.$route.name
  }

  get logo() {
    const baseUrl = configManager.get('VUE_APP_FEWS_WEBSERVICES_URL')
    const transformRequestFn = (request: Request) => Promise.resolve(authenticationManager.transformRequestAuth(request))
    const webServiceProvider = new PiWebserviceProvider(baseUrl, { transformRequestFn })
    const defaultLogo: string = `${process.env.BASE_URL}logo.png`
    const logo: string = this.webOcGeneral?.icons?.logo === undefined ? defaultLogo : webServiceProvider.resourcesStaticUrl(this.webOcGeneral.icons.logo).toString()
    return logo
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

.sidebar-title{
  margin: 10px 25px;
  font-size:1.4em;
}

.view-sidebar {
  z-index: 150
}
</style>
