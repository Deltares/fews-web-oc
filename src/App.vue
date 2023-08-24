<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import DefaultLayout from './layouts/DefaultLayout.vue'
import { onBeforeMount } from 'vue'
import { authenticationManager } from './services/authentication/AuthenticationManager'
import { configManager } from './services/application-config';

const route = useRoute()
const router = useRouter()

onBeforeMount(async () => {
  console.log('onBeforeMount', route.path, configManager.authenticationIsEnabled )
  if (configManager.authenticationIsEnabled) {
    if (route.path === '/auth/callback') {
      const user =
        await authenticationManager.userManager.signinRedirectCallback()
      console.log('onBeforeMount', route)


      const path: string = user.state === null ? '/about' : (user.state as string)
      router.push({ path })
    }
  }
})
</script>

<template>
  <Suspense>
    <template #default>
      <DefaultLayout style="height: 100%"> </DefaultLayout>
    </template>
    <template #fallback>
      <span>Loading...</span>
    </template>
  </Suspense>
</template>

<style scoped></style>
