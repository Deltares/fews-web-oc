<template>
  <div/>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

@Component
export default class Callback extends Vue {
  created (): void {
    this.$auth
      .signinRedirectCallback()
      .then(user => {
        this.$router.push({ name: user.state })
      })
      .catch(err => console.error(err))
  }
}
</script>
