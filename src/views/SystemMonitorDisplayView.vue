<template>
  <div class="d-flex flex-column h-100 w-100">
    <v-card-title>Import/Export Status</v-card-title>
    <ImportExportStatusComponent :timeOut="1000" class="overflow-y-auto" />
  </div>
</template>

<script setup lang="ts">
import ImportExportStatusComponent from '@/components/systemmonitor/ImportExportStatusComponent.vue'
</script>
