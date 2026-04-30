<template>
  <v-menu :close-on-content-click="false">
    <template #activator="{ props }">
      <v-btn v-bind="props" icon="mdi-share-variant" />
    </template>

    <ShareMenu />
  </v-menu>
</template>

<script lang="ts" setup>
import ShareMenu from './ShareMenu.vue'
</script>
