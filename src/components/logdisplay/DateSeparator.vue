<template>
  <div class="date-separator__container">
    <div class="date-separator__line"></div>
    <div class="date-separator__text">{{ formattedDate }}</div>
    <div class="date-separator__line"></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  date: string
}>()

const formattedDate = computed(() => {
  const messageDate = new Date(props.date)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)

  if (messageDate.toDateString() === today.toDateString()) {
    return 'Today'
  }

  if (messageDate.toDateString() === yesterday.toDateString()) {
    return 'Yesterday'
  }

  // For other dates, return a formatted date
  return messageDate.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
})
</script>

<style scoped>
.date-separator__container {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 16px 0;
  gap: 12px;
  width: 100%;
}

.date-separator__text {
  font-size: 0.85rem;
  color: rgba(var(--v-theme-on-surface), 0.7);
  padding: 0 8px;
  white-space: nowrap;
}

.date-separator__line {
  flex: 1;
  height: 1px;
  background-color: rgba(var(--v-theme-on-surface), 0.1);
}
</style>
