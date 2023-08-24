<script setup lang="ts">
import DefaultLayout from './layouts/DefaultLayout.vue'
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
