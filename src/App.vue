<template>
  <component :is="layout">
    <router-view/>
  </component>
</template>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'
import Default from '@/layouts/Default.vue'
import Empty from '@/layouts/Empty.vue'
import { User } from 'oidc-client-ts'
import { namespace } from 'vuex-class'

const fewsConfigModule = namespace('fewsconfig')

@Component({
  components: {
    Default,
    Empty
  }
})
export default class App extends Vue {
  @fewsConfigModule.Action('setFewsConfig')
    setFewsConfig!: () => Promise<void>

  async created(): Promise<void> {
    // Authentication is enabled
    if (this.$route.path === "/auth/callback") {
      this.$auth
      .signinRedirectCallback()
      .then((user: User) => {
        this.setFewsConfig()
        this.$router.push({ name: user.state as string })
      })
      .catch(err => console.error(err))
    }
    // Authentication is not enabled
    if (!this.$config.authenticationIsEnabled) {
      this.setFewsConfig()
    }
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
