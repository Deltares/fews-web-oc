<template>
  <v-btn
    variant="flat"
    :disabled="disabled"
    prepend-icon="mdi-plus"
    text="Create new chart"
    :color="disabled ? undefined : 'primary'"
    :loading="loading"
    @click="emit('click', $event)"
  />
</template>

<script setup lang="ts">
interface Props {
  disabled?: boolean
  loading?: boolean
}
defineProps<Props>()

const emit = defineEmits(['click'])
</script>
