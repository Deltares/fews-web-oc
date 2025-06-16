<template>
  <v-btn
    variant="flat"
    :disabled="disabled"
    :prepend-icon="icon"
    :text="title"
    :color="disabled ? undefined : 'primary'"
    :loading="loading"
    @click="emit('click', $event)"
  />
</template>

<script setup lang="ts">
interface Props {
  disabled?: boolean
  loading?: boolean
  title?: string
  icon?: string
}
withDefaults(defineProps<Props>(), {
  title: 'Create new chart',
  icon: 'mdi-plus',
})

const emit = defineEmits(['click'])
</script>
