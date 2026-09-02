<template>
  <div>
    <v-btn v-if="requiresLogin" @click="login" variant="text"> Sign in</v-btn>
    <div v-else>
      <v-menu location="bottom" width="260" :close-on-content-click="false">
        <template #activator="{ props }">
          <v-btn v-bind="props" variant="text" icon>
            {{ initials }}
          </v-btn>
        </template>
        <v-list density="compact">
          <v-list-item>
            <div class="d-flex align-center">
              <span class="user-avatar mr-2">{{ initials }}</span>
              <span class="user-name">{{ name }}</span>
            </div>
          </v-list-item>
          <ExcludedPermissionsControl />
          <v-list-item @click="logout" v-if="hasUserManager">
            <v-list-item-title>{{ t('auth.signOut') }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { authenticationManager } from '../../services/authentication/AuthenticationManager.js'
import { useRoute } from 'vue-router'
import type { User } from 'oidc-client-ts'
import {
  initialsFromUpperCaseName,
  initialsFromPreferredUserName,
} from '@/lib/auth/initials.ts'

import ExcludedPermissionsControl from '@/components/permissions/ExcludedPermissionsControl.vue'

const { t } = useI18n()
const route = useRoute()

const PLACEHOLDER_NAME = 'User'
const hasUserManager = !!authenticationManager?.userManager

const initials = ref('U')
const roles = ref([''])
const name = ref(PLACEHOLDER_NAME)
const user = ref<User | null>(null)
const requiresLogin = ref(hasUserManager)

function setUser() {
  if (!hasUserManager) return
  authenticationManager.userManager
    .getUser()
    .then((response) => {
      user.value = response
    })
    .catch((err) => {
      console.error({ err })
    })
}

if (hasUserManager) {
  authenticationManager.userManager.events.addUserLoaded(() => {
    requiresLogin.value = false
    setUser()
  })
}

onMounted(() => {
  if (hasUserManager) {
    setUser()
  } else {
    requiresLogin.value = false
  }
})

watch(user, () => {
  if (user.value !== null) {
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
  } else {
    initials.value = 'U'
    name.value = PLACEHOLDER_NAME
    requiresLogin.value = hasUserManager
  }
})

function login(): void {
  if (!hasUserManager) return
  authenticationManager.userManager.signinRedirect({ state: route.path })
}

function logout(): void {
  if (!hasUserManager) return
  requiresLogin.value = true
  authenticationManager.userManager.signoutRedirect({ state: '/login' })
}
</script>

<style>
.navbar-logo {
  height: 100%;
}
.user-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--weboc-app-bar-bg-color);
  color: #fff;
  font-weight: 600;
  font-size: 1rem;
  letter-spacing: 0.5px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
}
.user-name {
  font-size: 1rem;
  font-weight: 500;
  color: var(--contrast-color, #222);
}
</style>
