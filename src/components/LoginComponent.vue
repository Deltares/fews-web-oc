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
          <v-list-item v-if="user.profile.roles">
            <v-list-item-icon>
              <v-icon>mdi-account-key</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
            {{ user.profile.roles[0].toLowerCase() }}
            </v-list-item-content>
          </v-list-item>
          <v-list-item v-else>
            <v-list-item-icon>
              <v-icon>mdi-account-eye</v-icon>
            </v-list-item-icon>
            <v-list-item-content>Guest</v-list-item-content>
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
import { User } from 'oidc-client-ts'

function initialsFromName (givenName: string): string {
  let initials = ''
  for (let i = 0; i < givenName.length; i++) {
    const character = givenName[i]
    if (character !== character.toLowerCase()) { initials = initials + character }
    if (initials.length == 2) return initials;
  }
  return initials
}

@Component
export default class LoginComponent extends Vue {
  user: User | null = null

  mounted (): void {
    this.$auth.userManager
      .getUser()
      .then(user => {
        this.user = user
      })
      .catch(err => {
        console.log({ err })
      })
  }

  login (): void {
    this.$auth.userManager.signinRedirect({ state: this.$route.path })
  }

  logout (): void {
    this.$auth.userManager.signoutRedirect({ state: '/portal' })
  }

  get initials (): string {
    if (this.user?.profile?.name === undefined) return ''
    return initialsFromName(this.user.profile.name)
  }
}
</script>

<style>
.navbar-logo {
  height: 100%;
}
</style>
