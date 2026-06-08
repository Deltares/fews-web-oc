<template>
  <BaseTasksFilterControl
    v-model="selected"
    :items="logLevelsItems"
    label="Log Levels"
    sortItems
  />
</template>
<script setup lang="ts">
import BaseTasksFilterControl from '@/components/tasks/BaseTaskFilterControl.vue'
import { computed } from 'vue'
import { levelToIcon, logLevels } from '@/lib/log'

const selected = defineModel<string[]>({ required: true })

const logLevelsItems = computed(() =>
  logLevels.map((logLevel) => {
    return {
      id: logLevel,
      icon: levelToIcon(logLevel),
      title: logLevel,
      value: logLevel,
    }
  }),
)
</script>
