<template>
  <div class="keyboard-hint">
    <kbd v-for="key in keys" :key="key">{{ key }}</kbd>
    <span class="ms-1">{{ label }}</span>
  </div>
</template>

<script setup lang="ts">
interface Props {
  keys: string[]
  label: string
}
defineProps<Props>()
</script>

<style scoped>
.keyboard-hint {
  display: flex;
  align-items: center;
  gap: 2px;
}

/* Same style as the keyboard hints of the table and search dialog */
.keyboard-hint kbd {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 20px;
  padding: 0 5px;
  border: 1px solid color-mix(in srgb, currentColor 60%, transparent);
  border-radius: 4px;
  font-size: 11px;
}
</style>
