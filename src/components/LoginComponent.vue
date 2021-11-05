<template>
  <v-app-bar color="primary" dense app>
    <img src="@/assets/images/deltares_logo.png" contain height="100%" />
    <v-toolbar-title>Delft-fews web OC</v-toolbar-title>
    <v-spacer />
    <v-btn v-if="!user" @click="login" text>
      Login
    </v-btn>
    <div v-else>
      {{ user.profile.name }}
      <v-btn @click="logout" text>
        Logout
      </v-btn>
    </div>
  </v-app-bar>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { User } from 'oidc-client'

@Component
export default class LoginComponent extends Vue {
  user: User | null = null

  mounted (): void {
    this.$auth
      .getUser()
      .then(user => {
        this.user = user
        console.log(this.user)
      })
      .catch(err => {
        console.log({ err })
      })
  }

  login (): void {
    this.$auth.signinRedirect({ state: window.location.href })
  }

  logout (): void {
    this.$auth.signoutRedirect({ state: '/portal' })
  }
}
</script>

<style>
.navbar-logo {
  height: 100%;
}
</style>
