<template>
  <v-btn @click="login" color="primary">
    <v-icon>mdi-microsoft-windows</v-icon> {{loginButtonText}}
  </v-btn>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'

@Component
export default class DeltaresLogin extends Vue {
  @Prop()
  loginButtonText!: string

  login (): void {
    const redirect = this.$route.query.redirect || '/about'
    this.$auth.userManager.signinRedirect({ state: redirect })
  }
}
</script>
