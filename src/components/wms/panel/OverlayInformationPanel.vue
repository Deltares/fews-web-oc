<template>
  <v-menu transition="slide-y-transition" :close-on-content-click="false">
    <template #activator="{ props }">
      <ControlChip v-bind="props">
        <v-icon>mdi-layers-outline</v-icon>
      </ControlChip>
    </template>
    <v-list class="information-panel-list">
      <slot></slot>
    </v-list>
  </v-menu>
</template>

<script setup lang="ts">
import ControlChip from '@/components/wms/ControlChip.vue'
</script>
