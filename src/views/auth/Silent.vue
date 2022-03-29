<template>
  <div />
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

@Component
export default class Silent extends Vue {
  mounted (): void {
    this.$auth.signinSilentCallback()
  }
}
</script>
