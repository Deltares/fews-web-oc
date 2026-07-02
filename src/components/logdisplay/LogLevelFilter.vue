<template>
  <v-btn-toggle v-model="selected" variant="tonal" density="compact" multiple>
    <v-btn
      v-for="item in logLevelsItems"
      :key="item.id"
      :value="item.value"
      density="compact"
      :color="item.color"
      :prepend-icon="item.icon"
      class="text-label-large"
      size="small"
    >
      {{ item.title }}
    </v-btn>
  </v-btn-toggle>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { levelToIcon, levelToColor, levelToTitle, logLevels } from '@/lib/log'

const selected = defineModel<string[]>({ required: true })

const logLevelsItems = computed(() =>
  logLevels.map((logLevel) => {
    return {
      id: logLevel,
      icon: levelToIcon(logLevel),
      title: levelToTitle(logLevel),
      color: levelToColor(logLevel),
      value: logLevel,
    }
  }),
)
</script>
