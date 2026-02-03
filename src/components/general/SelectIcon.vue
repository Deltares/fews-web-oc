<template>
  <v-icon class="select-icon" :class="{ active }" :icon />
</template>

<script setup lang="ts">
interface Props {
  active: boolean
  icon?: string
}

withDefaults(defineProps<Props>(), {
  icon: 'mdi-chevron-down',
})
</script>

<style scoped>
.select-icon {
  transition: 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.select-icon.active {
  transform: rotate(180deg);
}
</style>
