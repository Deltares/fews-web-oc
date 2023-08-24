<template>
  <div/>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { authenticationManager } from '../../services/authentication/AuthenticationManager'


  // @fewsConfigModule.Action('deleteComponents')
  //   deleteComponents!: () => void

  onMounted((): void => {
    authenticationManager.userManager
      .signoutRedirectCallback()
      .then(() => {
        // this.deleteComponents()
        // window.location.href = this.$router.options.base + 'login'
      })
      .catch(err => console.error(err))
  })
</script>
