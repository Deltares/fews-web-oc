<template>
  <ObservablePlot :options="options" :key="key"></ObservablePlot>
</template>
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import ObservablePlot from '@/components/ObservablePlot.js'

const options = ref<any>('')
const key = ref(0)

onMounted(async () => {
  const scriptName = 'soundings'
  const { default: code } = await import(`@/components/plots/${scriptName}.ts`)
  console.log(code)
  key.value = 1
  options.value = code
})
</script>
