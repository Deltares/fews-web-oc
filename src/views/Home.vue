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
import { RequestHeaderAuthorization } from '@/services/application-config/ApplicationConfig'

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
      props: { src: `${this.$config.get<string>('VUE_APP_FEWS_WEBSERVICES_URL')}/ssd?request=GetDisplay&ssd=Overzichtsscherm_WMCN` }
    },
    {
      title: 'Time Series Display',
      to: 'series',
      component: 'time-series-component',
      props: { src: `${this.$config.get('VUE_APP_FEWS_WEBSERVICES_URL')}/rest/fewspiservice/v1/topology/nodes` }
    },
  ]

  async mounted (): Promise<void> {
    const oidcUser = await this.$auth.getUser()
    if (oidcUser === null) return
    const listener = {
      httpRequestOpenInterceptor: XMLHttpRequest.prototype.open,
      httpRequestSendInterceptor: XMLHttpRequest.prototype.send
    }
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const eu = this
    const authorizationType = this.$config.get<RequestHeaderAuthorization>('VUE_APP_REQEUST_HEADER_AUTHORIZATION')
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    XMLHttpRequest.prototype.open = function (method: string, url: string|URL, async?: boolean, username?: string, password?: string) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const argumentsTyped: any = arguments
      listener.httpRequestOpenInterceptor.apply(this, argumentsTyped)
      if (authorizationType === RequestHeaderAuthorization.BEARER) {
        const idToken = oidcUser.id_token
        this.setRequestHeader('Authorization', 'Bearer ' + idToken)
      }
      eu.$emit('start', this)
      this.addEventListener('load', function () {
        eu.$emit('finish', this)
      })
    }
  }
}
</script>
