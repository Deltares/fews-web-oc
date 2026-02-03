<template>
  <table description="Colour Legend Table">
    <tbody>
      <template v-if="horizontal">
        <tr>
          <td v-for="item in colourMap" :key="item.label">
            <div class="box" :style="{ backgroundColor: item.color }" />
          </td>
        </tr>
        <tr v-if="!hideLabels">
          <td v-for="item in colourMap" :key="item.label">
            {{ item.label }}
          </td>
        </tr>
      </template>

      <template v-else>
        <tr v-for="item in colourMap" :key="item.label">
          <td>
            <div class="box" :style="{ backgroundColor: item.color }" />
          </td>
          <td v-if="!hideLabels">{{ item.label }}</td>
        </tr>
      </template>
    </tbody>
  </table>
</template>

<script setup lang="ts">
import type { ColourMap } from '@deltares/fews-wms-requests'

interface Props {
  colourMap: ColourMap
  horizontal?: boolean
  hideLabels?: boolean
}

defineProps<Props>()
</script>

<style scoped>
.box {
  height: 20px;
  width: 20px;
  border: 1px solid black;
}

table {
  font-size: 0.825em;
}
</style>
