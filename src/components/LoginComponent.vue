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
            <v-list-item-title>{{ user.profile.given_name }} {{ user.profile.family_name }}</v-list-item-title>
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

function firstUppercaseChar (str: string): string {
  for (var i = 0; i < str.length; i++) {
    const character = str[i]
    if (character !== character.toLowerCase()) { return character }
  }
  return ''
}

function initialsFromName (givenName: string, familyName: string): string {
  return firstUppercaseChar(givenName) + firstUppercaseChar(familyName)
}

@Component
export default class LoginComponent extends Vue {
  user: User | null = null

  mounted (): void {
    this.$auth
      .getUser()
      .then(user => {
        this.user = user
      })
      .catch(err => {
        console.log({ err })
      })
  }

  login (): void {
    this.$auth.signinRedirect({ state: this.$route.name })
  }

  logout (): void {
    this.$auth.signoutRedirect({ state: '/portal' })
  }

  get initials (): string {
    if (this.user?.profile?.given_name === undefined || this.user?.profile?.family_name === undefined) return ''
    return initialsFromName(this.user.profile.given_name, this.user.profile.family_name)
  }
}
</script>

<style>
.navbar-logo {
  height: 100%;
}
</style>
