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
import { useRoute } from 'vue-router'
import type { User } from 'oidc-client-ts'
import {
  initialsFromUpperCaseName,
  initialsFromPreferredUserName,
} from '@/lib/auth/initials.ts'

import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const route = useRoute()
const initials = ref('')
const roles = ref([''])
const name = ref('')
const user = ref<User | null>(null)
const requiresLogin = ref(true)

function setUser() {
  authenticationManager.userManager
    .getUser()
    .then((response) => {
      user.value = response
    })
    .catch((err) => {
      console.error({ err })
    })
}

authenticationManager.userManager.events.addUserLoaded(() => {
  requiresLogin.value = false
  setUser()
})

onMounted((): void => {
  setUser()
})

watch(user, () => {
  if (user.value === null) {
    requiresLogin.value = true
  } else {
    requiresLogin.value = false
    if (user.value.profile?.name !== undefined) {
      name.value = user.value.profile.name
      initials.value = initialsFromUpperCaseName(user.value.profile.name)
      roles.value = user.value.profile.roles
        ? (user.value.profile.roles as string[])
        : []
    } else if (user.value.profile?.preferred_username !== undefined) {
      name.value = user.value.profile.preferred_username
      initials.value = initialsFromPreferredUserName(
        user.value.profile.preferred_username,
      )
      roles.value = user.value.profile.roles
        ? (user.value.profile.roles as string[])
        : []
    }
  }
})

function login(): void {
  authenticationManager.userManager.signinRedirect({
    state: encodeURIComponent(route.fullPath),
  })
}

function logout(): void {
  requiresLogin.value = true
  authenticationManager.userManager.signoutRedirect({ state: '/login' })
}
</script>

<style>
.navbar-logo {
  height: 100%;
}
</style>
