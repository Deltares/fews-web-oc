<template>
  <div/>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { namespace } from 'vuex-class'

const fewsConfigModule = namespace('fewsconfig')

@Component
export default class Logout extends Vue {
  @fewsConfigModule.Action('deleteComponents')
    deleteComponents!: () => void

  mounted (): void {
    this.$auth
      .signoutRedirectCallback()
      .then(() => {
        this.deleteComponents()
        window.location.href = this.$router.options.base + 'login'
      })
      .catch(err => console.error(err))
  }
}
</script>
