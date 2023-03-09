<template>
  <v-app id="app">
    <v-app-bar color="#080C80" dense app dark :clipped-left="!$vuetify.rtl" :clipped-right="$vuetify.rtl">
      <v-btn v-if="!$vuetify.breakpoint.mobile" text>{{$config.get('VUE_APP_TITLE')}}</v-btn>
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
import LoginComponent from '@/components/LoginComponent.vue'

import { namespace } from 'vuex-class'
import { Alert } from '@/store/modules/alerts/types'
import type { WebOCComponent } from '@/store/modules/fews-config/types'

const alertsModule = namespace('alerts')
const fewsConfigModule = namespace('fewsconfig')

@Component({
  components: {
    CogMenu,
    LoginComponent
  }
})
export default class Default extends Vue {

  @alertsModule.Getter('listActive')
    activeAlerts!: Alert[]
  @alertsModule.State('alerts')
    alerts!: Alert[]
  @fewsConfigModule.State('components')
    webOCComponents!: { [key: string]: WebOCComponent }

  drawer: boolean | null = null

  toggleDrawer (): void {
    this.drawer = !this.drawer
  }

  get menuLabel (): string {
    return this.menuItems.find((item) => item.to.name === this.$route.name)?.id || ''
  }

  get menuIcon (): string {
    return this.menuItems.find((item) => item.to.name === this.$route.name)?.icon || ''
  }

  get showAlerts() {
    return this.activeAlerts.length > 0
  }

  dismissAlert(alert: Alert, value: boolean) {
    alert.active = value
  }

  get menuItems (): {id: string, to: {name: string}, title: string, icon: string}[] {
    const menuItems = Object.values(this.webOCComponents).map(componentConfig => {
      return {
        id: componentConfig.id,
        to: componentConfig.params !== undefined ? { name: componentConfig.component, params: componentConfig.params } : { name: componentConfig.component },
        title: componentConfig.title,
        icon: componentConfig.icon
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
  font-family: "RO-Sans", Avenir, Helvetica, Arial, sans-serif !important;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  height: 100%;
  overflow: hidden;
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
