<template>
  <div class="d-flex flex-column h-100 w-100" :class="{ fullscreen }">
    <v-toolbar density="compact" variant="flat" class="toolbar">
      <slot name="toolbar">
        {{ props.title }}
      </slot>
      <slot name="toolbar-append" v-bind:refs="$refs"></slot>
    </v-toolbar>
    <v-sheet fluid class="component-container">
      <slot></slot>
    </v-sheet>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
  title?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
})

const fullscreen = ref(false)

const fullscreenIcon = computed(() => {
  return fullscreen.value ? 'mdi-fullscreen-exit' : 'mdi-fullscreen'
})
</script>

<style scoped>
.fullscreen {
  position: fixed;
  flex-grow: 1 1 80%;
  top: 0px;
  right: 0px;
  width: 100%;
  z-index: 9000;
  opacity: 0.99;
}

.component-container {
  display: flex;
  flex: 1 1 100%;
  flex-direction: column;
  height: calc(100% - 72px);
}

.toolbar {
  flex-grow: 0;
}
</style>
