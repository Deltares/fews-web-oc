<template>
  <component :is="layout">
    <router-view/>
  </component>
</template>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'
import Default from '@/layouts/Default.vue'
import Empty from '@/layouts/Empty.vue'

import { namespace } from 'vuex-class'
import type { WebOCComponent } from '@/store/modules/fews-config/types'
import { routesViews } from '@/router'

const fewsConfigModule = namespace('fewsconfig')

@Component({
  components: {
    Default,
    Empty
  }
})
export default class App extends Vue {
  @fewsConfigModule.Mutation('setComponents') setComponents!: (webOCComponents: { [key: string]: WebOCComponent }) => void

  created (): void {
    document.title = this.$config.get('VUE_APP_TITLE')
    fetch(`${process.env.BASE_URL}fews-config.json`)
      .then(res => res.json())
      .then(fewsConfig => {
        const webOCComponents: { [key: string]: WebOCComponent } = {}
        for ( const componentConfig of fewsConfig.components ) {
          const webOCComponent: WebOCComponent = {
            id: componentConfig.id,
            component: componentConfig.component,
            title: componentConfig.title,
            icon: componentConfig.icon,
            params: componentConfig.params
          }
          webOCComponents[componentConfig.id] = webOCComponent
          const route = routesViews.find((route) => route.name === webOCComponent.component)
          if (route !== undefined) {
            this.$router.addRoute(route)
          }
        }
        this.setComponents(webOCComponents)
        const defaultPath = fewsConfig.components[0].params !== undefined ? { name: fewsConfig.components[0].component, params: fewsConfig.components[0].params } : { name: fewsConfig.components[0].component }
        this.$router.addRoute({path: '/', name: 'Default', redirect: defaultPath})
      })
  }

  get layout (): string {
    let layout = 'default'
    this.$route.matched.some(
      record => {
        if (record.meta.layout) layout = record.meta.layout
        return record.meta.layout
      }
    )
    return layout
  }
}
</script>

<style>
.v-application {
  font-family: "RO-Sans", sans-serif !important;
 }

.v-application .title {
  font-family: "RO-Sans", sans-serif !important;
}

.v-application .body-2 {
  font-family: "RO-Sans", sans-serif !important;
}

.v-application .text-h4 {
  font-family: "RO-Sans", sans-serif !important;
}

html, body {
  margin: 0px;
  font-size: 14px;
  line-height: 1.2;
}

.v-btn {
  text-transform: capitalize !important;
}

.theme--light *::-webkit-scrollbar {
  width: 15px;
}

.theme--light *::-webkit-scrollbar-track, *::-webkit-scrollbar-corner {
  background: #e6e6e6;
}

.theme--light *::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border: solid 3px #e6e6e6;
  border-radius: 7px;
}

.theme--light *::-webkit-scrollbar-thumb:hover {
  background: #7d7d7d;
}

.theme--dark *::-webkit-scrollbar {
  width: 15px;
}

.theme--dark *::-webkit-scrollbar-track, *::-webkit-scrollbar-corner {
  background: #202020;
}

.theme--dark *::-webkit-scrollbar-thumb {
  background: #757575;
  border: solid 3px #202020;
  border-radius: 7px;
}

.theme--dark *::-webkit-scrollbar-thumb:hover {
  background: #9e9e9e;
}
</style>
