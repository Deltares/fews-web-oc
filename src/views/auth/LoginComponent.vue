<template>
  <div>
    <v-btn v-if="requiresLogin" @click="login" variant="text"> Sign in</v-btn>
    <div v-else>
      <v-menu location="bottom" width="200">
        <template #activator="{ props }">
          <v-btn v-bind="props" variant="text" icon>
            {{ initials }}
          </v-btn>
        </template>
        <v-list density="compact">
          <v-list-item>{{ name }}</v-list-item>
          <v-list-item @click="logout">
            <v-list-item-title>{{ t('auth.signOut') }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { authenticationManager } from '../../services/authentication/AuthenticationManager.js'
import { basicAuthManager } from '../../services/authentication/BasicAuthManager'
import { configManager } from '../../services/application-config'
import { useRoute, useRouter } from 'vue-router'
import type { User } from 'oidc-client-ts'

import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const isBasicAuth = configManager.authType === 'basic'

function initialsFromName(givenName: string): string {
  let initialsString = ''
  for (const character of givenName) {
    if (character !== character.toLowerCase()) {
      initialsString = initialsString + character
    }
    if (initialsString.length === 2) return initialsString
  }
  return initialsString
}

const route = useRoute()
const router = useRouter()
const initials = ref('')
const roles = ref([''])
const name = ref('')
const user = ref<User | null>(null)
const requiresLogin = ref(true)

function setUser() {
  if (isBasicAuth) {
    if (basicAuthManager.isAuthenticated()) {
      requiresLogin.value = false
      const username = basicAuthManager.getUsername()
      name.value = username
      initials.value = username.slice(0, 2).toUpperCase()
    } else {
      requiresLogin.value = true
    }
    return
  }
  authenticationManager.userManager
    .getUser()
    .then((response) => {
      user.value = response
    })
    .catch((err) => {
      console.error({ err })
    })
}

if (!isBasicAuth) {
  authenticationManager.userManager.events.addUserLoaded(() => {
    requiresLogin.value = false
    setUser()
  })
}

onMounted((): void => {
  setUser()
})

watch(user, () => {
  if (user.value !== null) {
    requiresLogin.value = false
    if (user.value.profile?.name !== undefined) {
      name.value = user.value.profile.name
      initials.value = initialsFromName(user.value.profile.name)
      roles.value = user.value.profile.roles
        ? (user.value.profile.roles as string[])
        : []
    }
  } else if (!isBasicAuth) {
    requiresLogin.value = true
  }
})

function login(): void {
  if (isBasicAuth) {
    router.push({ name: 'Login', query: { redirect: route.path } })
  } else {
    authenticationManager.userManager.signinRedirect({ state: route.path })
  }
}

function logout(): void {
  requiresLogin.value = true
  if (isBasicAuth) {
    basicAuthManager.logout()
    router.push({ name: 'Login' })
  } else {
    authenticationManager.userManager.signoutRedirect({ state: '/login' })
  }
}
</script>

<style>
.navbar-logo {
  height: 100%;
}
</style>
