<template>
  <div>
    <v-btn v-if="!user" @click="login" text>
      Sign in
    </v-btn>
    <div v-else>
      <v-menu
        bottom
        offset-y
      >
        <template v-slot:activator="{ on, attrs }">
          <v-btn
            v-bind="attrs"
            v-on="on"
            small
            fab>
            {{ initials }}
          </v-btn>
        </template>
        <v-list>
          <v-list-item>
            <v-list-item-title>{{ user.profile.name }}</v-list-item-title>
          </v-list-item>
          <v-list-item  @click="logout">
            <v-list-item-action-text>Sign out</v-list-item-action-text>
          </v-list-item>
        </v-list>
      </v-menu>
    </div>
  </div>
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

  get initials (): string {
    if (this.user?.profile?.name === undefined) return ''
    return this.user.profile.name
      .replace(/\b(\w)\w+/g, '$1')
      .replace(/\s/g, '')
      .toUpperCase()
  }
}
</script>

<style>
.navbar-logo {
  height: 100%;
}
</style>
