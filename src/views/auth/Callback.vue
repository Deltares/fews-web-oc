<template>
  <div />
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

@Component
export default class Callback extends Vue {
  mounted (): void {
    this.$auth
      .signinRedirectCallback()
      .then(user => (window.location = user.state))
      .catch(err => console.error(err))
  }
}
</script>
