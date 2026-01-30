<template>
  <table description="Colour Legend Table">
    <tr v-for="item in colourMap">
      <td>
        <div class="box" :style="{ backgroundColor: item.color }" />
      </td>
      <td>{{ item.label }}</td>
    </tr>
  </table>
</template>

<script setup lang="ts">
import type { ColourMap } from '@deltares/fews-wms-requests'

interface Props {
  colourMap: ColourMap
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
