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
  position: relative;
  border-radius: 24px;
}

.icon-group__underlay {
  position: absolute;
  inset: 0; /* fill the container */
  border-radius: 20px;
  background-color: currentColor;
  opacity: var(--v-activated-opacity); /* hidden by default */
  transition: opacity 0.18s ease;
}

/* 1. Remove focus style from buttons */
.last-btn:focus {
  outline: none !important;
}

/* 2. Show focus outline on the *group* instead */
.icon-group:has(.last-btn:focus) {
  outline: 1px solid rgb(33, 150, 243) !important;
  outline: 2px solid var(--v-theme-primary);
  outline-offset: -1px;
}
</style>
