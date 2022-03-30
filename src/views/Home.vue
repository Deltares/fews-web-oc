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
import MapComponent from './MapComponent.vue'
import SsdComponent from './SsdComponent.vue'
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
      props: { src: 'https://rwsos-dataservices-ont.avi.deltares.nl/iwp/FewsWebServices/ssd?request=GetDisplay&ssd=Overzichtsscherm_WMCN' }
    },
    {
      title: 'Time Series Display',
      to: 'display',
      component: 'display-component'
    },
    {
      title: 'SSD Authenticatie WebOC_Overzichtsscherm_WMCN (AllowTesting)',
      to: 'ssd',
      component: 'ssd-component',
      props: { src: 'https://rwsos-dataservices-ont.avi.deltares.nl/iwp/test/FewsWebServices/ssd?request=GetDisplay&ssd=WebOC_Overzichtsscherm_WMCN' }
    },
    {
      title: 'SSD Authenticatie WebOC_CompartimentIJsselmeer (AllowDeltares)',
      to: 'ssd',
      component: 'ssd-component',
      props: { src: 'https://rwsos-dataservices-ont.avi.deltares.nl/iwp/test/FewsWebServices/ssd?request=GetDisplay&ssd=WebOC_CompartimentIJsselmeer' }
    },
    {
      title: 'SSD Authenticatie WebOC_NDB_10m (AllowForecasters)',
      to: 'ssd',
      component: 'ssd-component',
      props: { src: 'https://rwsos-dataservices-ont.avi.deltares.nl/iwp/test/FewsWebServices/ssd?request=GetDisplay&ssd=WebOC_IJsselmeergebied' }
    }

  ]

  mounted () {
    // TODO key should be constructed from .env
    const sessionEntry = sessionStorage.getItem('oidc.user:https://login.microsoftonline.com/15f3fe0e-d712-4981-bc7c-fe949af215bb/v2.0:a64f0553-bce1-4883-8ba5-e0cc5c6bf988')
    console.log(sessionEntry)
    var oidcUser = JSON.parse(sessionEntry)
    console.log(oidcUser)
    const idToken = oidcUser.id_token
    console.log(idToken)
    const listener = {
      tempOpen: XMLHttpRequest.prototype.open,
      tempSend: XMLHttpRequest.prototype.send
    }
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const eu = this
    XMLHttpRequest.prototype.open = function (a = '', b = '') {
      console.log('Setting Bearer for ' + a + ' and ' + b + ' with ' + idToken)
      listener.tempOpen.apply(this, arguments)
      if (oidcUser) {
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
