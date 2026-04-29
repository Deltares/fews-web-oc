<template>
  <v-btn
    color="grey-lighten-1"
    :icon="favorite ? 'mdi-star' : 'mdi-star-outline'"
    @click="favorite = !favorite"
    v-tooltip:top="'Favorite'"
  />
</template>

<script setup lang="ts">
const favorite = defineModel<boolean>({ required: true })
</script>
