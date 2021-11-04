<template>
  <div />
</template>

<script lang="ts">
import Oidc from 'oidc-client'
import { Component, Vue } from 'vue-property-decorator'

@Component
export default class Logout extends Vue {
  mounted (): void {
    new Oidc.UserManager()
      .signoutRedirectCallback()
      .then(user => (window.location = '/'))
      .catch(err => console.error(err))
  }
}
</script>
