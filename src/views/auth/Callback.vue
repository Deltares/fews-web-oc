<template>
  <div/>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { User } from 'oidc-client-ts'

@Component
export default class Callback extends Vue {
  created (): void {
    this.$auth
      .signinRedirectCallback()
      .then((user: User) => {
        this.$router.push({ name: user.state as string })
      })
      .catch(err => console.error(err))
  }
}
</script>
