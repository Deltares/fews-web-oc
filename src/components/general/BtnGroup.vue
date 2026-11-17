<template>
  <div class="icon-group">
    <div
      v-if="slots.default && slots.default().length > 0"
      class="icon-group__underlay"
    ></div>
    <slot name="persistent"></slot>
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import { useSlots } from 'vue'

const slots = useSlots()
</script>

<style>
.icon-group {
  display: inline-flex;
  align-items: center;
  position: relative;
  border-radius: 24px;
  /* No tap highlight, double tap zoom or text selection on touch screens */
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  user-select: none;
}

.icon-group__underlay {
  position: absolute;
  inset: 0; /* fill the container */
  border-radius: 20px;
  background-color: currentColor;
  opacity: var(--v-activated-opacity); /* hidden by default */
  transition: opacity 0.18s ease;
  pointer-events: none; /* let labels get hover for their tooltips */
}

/* Show the focus outline on the group instead of on its last button */
.icon-group .last-btn:focus-visible {
  outline: none;
}

.icon-group:has(.last-btn:focus-visible),
.icon-group:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: -1px;
}
</style>
