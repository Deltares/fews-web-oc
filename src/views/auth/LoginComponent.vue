<template>
  <div>
    <v-btn v-if="requiresLogin" @click="login" variant="text"> Sign in </v-btn>
    <div v-else>
      <v-menu location="bottom" width="200">
        <template #activator="{ props }">
          <v-btn v-bind="props" variant="text"           icon
>
            {{ initials }}
          </v-btn>
        </template>
        <v-list density="compact">
          <v-list-item>{{ name }}</v-list-item>
          <v-list-item v-if="roles.length">
            <template v-slot:prepend>
              <v-icon>mdi-account-eye</v-icon>
            </template>
            <v-list-item-title>{{ roles[0].toLowerCase() }}</v-list-item-title>
          </v-list-item>
          <v-list-item v-else>
            <template v-slot:prepend>
              <v-icon>mdi-account-eye</v-icon>
            </template>
            <v-list-item-title>Guest</v-list-item-title>
          </v-list-item>
          <v-list-item @click="logout">
            <v-list-item-title>Sign out</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { ref } from 'vue'
import { authenticationManager } from '../../services/authentication/AuthenticationManager.js'
import { useRoute } from 'vue-router';

function initialsFromName(givenName: string): string {
  let initials = ''
  for (let i = 0; i < givenName.length; i++) {
    const character = givenName[i]
    if (character !== character.toLowerCase()) {
      initials = initials + character
    }
    if (initials.length == 2) return initials
  }
  return initials
}

const route = useRoute()
const initials = ref('')
const roles = ref([''])
const name = ref('')
const requiresLogin = ref(true)

onMounted((): void => {
  authenticationManager.userManager
    .getUser()
    .then((user) => {
      if (user) {
        requiresLogin.value = false
        if (user.profile?.name !== undefined) {
          name.value = user.profile.email?.endsWith('@vortech.nl') ? `dr. ir. ${user.profile.name}` :  user.profile.name
          initials.value = initialsFromName(user.profile.name)
          console.log(user.profile)
          roles.value = user.profile.roles ? user.profile.roles as string[] : [] 
        }
      }
    })
    .catch((err) => {
      console.log({ err })
    })
})

function login(): void {
  authenticationManager.userManager.signinRedirect({ state: route.path })
}

function logout(): void {
  console.log('logout')
  authenticationManager.userManager.signoutRedirect({ state: '/login' })
}
</script>

<style>
.navbar-logo {
  height: 100%;
}
</style>
