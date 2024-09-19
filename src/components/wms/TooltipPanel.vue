<template>
  <v-chip label class="tooltip-chip">
    <v-icon>mdi-information</v-icon>
    <v-menu
      v-model="opened"
      transition="slide-y-transition"
      :close-on-content-click="false"
      activator="parent"
      persistent
      no-click-animation
    >
      <div class="tooltip-chip px-3 py-2 my-2 elevation-1">
        <div v-html="content" />
      </div>
    </v-menu>
  </v-chip>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  content: string
}

defineProps<Props>()

const opened = ref(true)
</script>

<style scoped>
.tooltip-chip {
  font-size: 0.825em;
  z-index: 1000;
  border-radius: 5px;
  backdrop-filter: blur(5px);
  background-color: rgba(var(--v-theme-surface), 0.8);
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
}
</style>
