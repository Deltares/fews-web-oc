<template>
  <div />
</template>

<script lang="ts">
import Oidc from 'oidc-client'
import { Component, Vue } from 'vue-property-decorator'

@Component
export default class Silent extends Vue {
  mounted (): void {
    new Oidc.UserManager({}).signinSilentCallback()
  }
}
</script>
