<template>
  <div/>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

@Component
export default class Logout extends Vue {
  mounted (): void {
    this.$auth
      .signoutRedirectCallback()
      .then(() => (window.location.href = this.$router.options.base + 'login'))
      .catch(err => console.error(err))
  }
}
</script>
