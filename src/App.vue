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
import { WebOcComponent } from '@/store/modules/fews-config/types'
import { routesViews } from '@/router'

const fewsConfigModule = namespace('fewsconfig')

@Component({
  components: {
    Default,
    Empty
  }
})
export default class App extends Vue {
  @fewsConfigModule.State('components')
    webOcComponents!: { [key: string]: WebOcComponent }
  @fewsConfigModule.Action('setFewsConfig')
    setFewsConfig!: () => Promise<void>

  async created(): Promise<void> {
    if (this.$config.authenticationIsEnabled) {
      if (this.$route.path === "/auth/callback") {
        const user = await this.$auth.signinRedirectCallback()
        const path: string = user.state === null ? '/home' : user.state as string
        this.$router.push({ path })
      }
      const user = await this.$auth.getUser()
      if (user !== null) await this.setFewsConfig()
    } else {
      await this.setFewsConfig()
    }
    this.setRoutes()
  }

  setRoutes(): void {
    Object.values(this.webOcComponents).forEach(webOcComponent => {
      const route = routesViews.find((route) => route.name === webOcComponent.type)
      if (route !== undefined) this.$router.addRoute(route)
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
