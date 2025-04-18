<template>
  <div class="d-flex flex-column h-100 w-100">
    <v-card-title>Import Status</v-card-title>
    <ImportStatusComponent :timeOut="1000" class="overflow-y-auto" />
  </div>
</template>

<script setup lang="ts">
import ImportStatusComponent from '@/components/systemmonitor/ImportStatusComponent.vue'
</script>
