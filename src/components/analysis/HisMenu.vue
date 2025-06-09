<template>
  <v-menu :close-on-content-click="false" eager>
    <template #activator="{ props }">
      <v-btn
        v-bind="props"
        :prepend-icon="icon"
        :text="text"
        variant="tonal"
        class="text-none"
      />
    </template>

    <template v-for="(_, slot) of slots" v-slot:[slot]="scope">
      <slot :name="slot" v-bind="scope" />
    </template>
  </v-menu>
</template>

<script setup lang="ts">
import { useSlots } from 'vue'

interface Props {
  icon?: string
  text?: string
}

defineProps<Props>()

// tsc doesnt understand useSlots type
const slots = useSlots() as Record<string, () => void>
</script>
