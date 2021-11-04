<template>
  <div />
</template>

<script lang="ts">
import Oidc from 'oidc-client'
import { Component, Vue } from 'vue-property-decorator'

@Component
export default class Callback extends Vue {
  mounted (): void {
    const store = new Oidc.WebStorageStateStore({ store: window.localStorage })
    new Oidc.UserManager({ userStore: store })
      .signinRedirectCallback()
      .then(user => (window.location = user.state))
      .catch(err => console.error(err))
  }
}
</script>
