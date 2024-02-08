<template>
  <v-chip pill label class="outer-chip">
    <v-btn-toggle mandatory v-model="layerKind">
      <v-btn v-for="item in items" :key="item.id" :value="item.id" small>
        {{ item.name }}
      </v-btn>
    </v-btn-toggle>
  </v-chip>
</template>

<script setup lang="ts">
import { LayerKind } from '@/lib/streamlines'

const items = [
  { id: LayerKind.Static, name: 'Static' },
  { id: LayerKind.Streamline, name: 'Animated' },
]

const layerKind = defineModel({ type: String })
</script>

<style scoped>
.outer-chip {
  backdrop-filter: blur(4px);
  background-color: rgba(var(--v-theme-surface), 0.8);
}
</style>
