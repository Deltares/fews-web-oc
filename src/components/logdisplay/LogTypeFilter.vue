<template>
  <BaseTaskFilterControl v-model="modelValue" :items="items" label="Log Types">
  </BaseTaskFilterControl>
</template>

<script setup lang="ts">
import { logTypes, type LogType } from '@/lib/log'
import BaseTaskFilterControl from '@/components/tasks/BaseTaskFilterControl.vue'
import { ref } from 'vue'

const modelValue = defineModel<LogType[]>({ required: true })

const items = ref(
  logTypes.map((logType) => {
    return {
      id: logType,
      title: logType,
      value: logType,
    }
  }),
)
</script>
