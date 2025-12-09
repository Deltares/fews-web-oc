<template>
  <div class="control-chip--container">
    <div class="control-chip__extension-slot">
      <slot name="extension"></slot>
    </div>
    <v-chip pill label class="control-chip">
      <slot></slot>
    </v-chip>
  </div>
</template>

<script lang="ts" setup></script>

<style scoped>
.control-chip--container {
  z-index: 1000;
  display: block;
  position: relative;
  width: max-content;
}

.control-chip {
  font-size: 0.825em;
  border-radius: 5px;
  backdrop-filter: blur(5px);
  background-color: rgba(var(--v-theme-surface), 0.8);
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
  /* border: 1px solid rgba(var(--v-border-color), 0.3); */
}

.control-chip__extension-slot {
  top: 28px;
  position: absolute;
  display: flex;
  justify-content: center;
}

.control-chip__extension-slot:hover *,
.control-chip__extension-slot *:hover,
.control-chip__extension-slot:focus-within * {
  display: inherit; /* visible */
}
</style>
