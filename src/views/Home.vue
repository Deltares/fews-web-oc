<template>
  <div class="home-container" style="height: 100%; overflow-y: auto;">
    <h1>Component Overview</h1>
    <v-container>
      <v-row>
        <v-col v-for="(item, index) in items" :key="index" :cols="12" :md="6"  :xl="4">
          <v-card>
            <v-card-title :to="item.to">{{ item.title }}
              <v-spacer/>
              <v-btn icon :to="item.to">
                <v-icon>mdi-share</v-icon>
              </v-btn>
            </v-card-title>
            <component :is="item.component" v-bind="item.props" style="height: 300px;">
            </component>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import MapComponent from '@/components/MapComponent.vue'
import SsdComponent from '@/components/SsdComponent.vue'
import DisplayComponent from './DisplayComponent.vue'

@Component({
  components: {
    MapComponent,
    SsdComponent,
    DisplayComponent
  }
})
export default class Home extends Vue {
  items = [
    {
      title: 'WMS layers',
      to: 'map',
      component: 'map-component'
    },
    {
      title: 'Schematic Status Display',
      to: 'ssd',
      component: 'ssd-component',
      props: { src: `${this.$config.get('VUE_APP_FEWS_WEBSERVICES_URL')}/ssd?request=GetDisplay&ssd=Overzichtsscherm_WMCN` }
    },
    {
      title: 'Time Series Display',
      to: 'display',
      component: 'display-component'
    },
  ]

  mounted (): void {
    const sessionKey = 'oidc.user:' + process.env.VUE_APP_AUTH_AUTHORITY + ':' + process.env.VUE_APP_AUTH_ID
    const sessionEntry = sessionStorage.getItem(sessionKey)
    if (!sessionEntry) return
    const oidcUser = JSON.parse(sessionEntry)
    console.log(oidcUser)
    const idToken = oidcUser.id_token
    console.log(idToken)
    const listener = {
      httpRequestOpenInterceptor: XMLHttpRequest.prototype.open,
      httpRequestSendInterceptor: XMLHttpRequest.prototype.send
    }
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const eu = this
    XMLHttpRequest.prototype.open = function (httpMethod = '', url = '') {
      console.log('Setting Bearer for ' + httpMethod + ' and ' + url + ' with ' + idToken)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const argumentsTyped: any = arguments
      listener.httpRequestOpenInterceptor.apply(this, argumentsTyped)
      if (oidcUser) {
        if (typeof url === 'string' && url.includes('https://rwsos-dataservices-ont.avi.deltares.nl/iwp/test/FewsWebServices')) {
          this.setRequestHeader('Authorization', 'Bearer ' + idToken)
        }
      }
      eu.$emit('start', this)
      this.addEventListener('load', function () {
        eu.$emit('finish', this)
      })
    }
  }
}
</script>
