<template>
  <v-hover v-slot="{ isHovering, props }">
    <div class="selection-container" v-bind="props">
      <v-checkbox-btn
        v-model="isSelected"
        v-if="isHovering || isSelected"
        density="compact"
        :color
        @click.stop
      />
      <v-icon v-else :icon @click.stop="isSelected = !isSelected" />
    </div>
  </v-hover>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  icon: string
  color: string
}

defineProps<Props>()

const isSelected = ref(false)
</script>

<style scoped>
.selection-container {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
}
</style>
