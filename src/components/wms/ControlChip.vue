<template>
  <v-chip pill label class="control-chip">
    <slot></slot>
  </v-chip>
</template>

<style scoped>
.control-chip {
  font-size: 0.825em;
  z-index: 1000;
  border-radius: 5px;
  backdrop-filter: blur(5px);
  background-color: rgba(var(--v-theme-surface), 0.8);
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
  /* border: 1px solid rgba(var(--v-border-color), 0.3); */
}
</style>
