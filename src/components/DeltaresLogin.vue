<template>
  <v-btn @click="login" color="primary">
    <v-icon>mdi-microsoft-windows</v-icon> Sign in with {{name}}
  </v-btn>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'

@Component
export default class DeltaresLogin extends Vue {
  @Prop()
    name!: string

  login (): void {
    const redirect = this.$route.query.redirect || '/home'
    this.$auth.userManager.signinRedirect({ state: redirect })
  }
}
</script>
