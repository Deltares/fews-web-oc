<template>
  <v-icon
    v-if="showLoading"
    icon="mdi-loading mdi-spin"
    :color
    :size
    class="overlay-spinner"
  />
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'

interface Props {
  color?: string
  size?: string
  delay?: number
}

const props = withDefaults(defineProps<Props>(), {
  color: 'black',
  size: '48',
  delay: 500,
})

const showLoading = ref(false)

onMounted(() => {
  setTimeout(() => {
    showLoading.value = true
  }, props.delay)
})
</script>

<style scoped>
.overlay-spinner {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
</style>
