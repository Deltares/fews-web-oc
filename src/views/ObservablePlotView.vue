<template>
  <ObservablePlot :options="options"></ObservablePlot>
</template>
<script setup lang="ts">
import * as Plot from '@observablehq/plot'
import ObservablePlot from '@/components/ObservablePlot.js'
import soundings from '@/assets/soundings.json'
import { options } from '@/components/plots/soundings.js'
</script>
