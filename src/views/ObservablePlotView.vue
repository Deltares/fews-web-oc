<template>
  <v-select
    label="Select plot"
    v-model="scriptName"
    :items="scripts"
  ></v-select>
  <ObservablePlot :options="options" :key="key"></ObservablePlot>
</template>
<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import ObservablePlot from '@/components/ObservablePlot.js'

const options = ref<any>('')
const key = ref('')
const scripts = ref(['empty', 'simple', 'soundings'])
const scriptName = ref('empty')

onMounted(onUpdateChart)

watch(scriptName, onUpdateChart)

async function onUpdateChart() {
  const { default: code } = await import(
    `@/components/plots/${scriptName.value}.ts`
  )
  console.log(code)
  key.value = scriptName.value
  options.value = code
}
</script>
