<template>
  <v-card flat density="compact" color="transparent" class="mx-2">
    <v-card-title class="d-flex align-center">
      <EditableTitle v-model="chart.title" class="ml-2" />
      <v-spacer />
      <v-menu location="bottom right">
        <template #activator="{ props }">
          <v-btn
            icon="mdi-dots-horizontal"
            variant="text"
            density="compact"
            v-bind="props"
          />
        </template>
        <v-list density="compact">
          <v-list-item
            title="Edit"
            prepend-icon="mdi-pencil"
            density="compact"
            @click="$emit('edit')"
          />
          <v-list-item
            title="Remove"
            prepend-icon="mdi-delete"
            density="compact"
            @click="$emit('remove')"
          />
          <v-list-item
            title="Download"
            prepend-icon="mdi-download"
            density="compact"
            @click="$emit('download')"
          />
          <v-list-item
            title="Save as Image"
            prepend-icon="mdi-image"
            density="compact"
            @click="$emit('saveAsImage')"
          />
        </v-list>
      </v-menu>
    </v-card-title>
    <slot />
  </v-card>
</template>

<script setup lang="ts">
import EditableTitle from '@/components/general/EditableTitle.vue'
import type { Chart } from '@/lib/analysis'

interface Props {
  chart: Chart
}

defineProps<Props>()

defineEmits(['edit', 'remove', 'download', 'saveAsImage'])
</script>
