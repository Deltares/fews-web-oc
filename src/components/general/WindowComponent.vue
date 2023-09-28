<template>
  <div class="window-component" :class="{ fullscreen }">
    <v-toolbar density="compact" variant="flat" class="toolbar">
      <v-spacer />
      <slot name="toolbar">
        {{ props.title }}
      </slot>
      <v-spacer />
      <v-btn size="small" variant="text" @click="fullscreen = !fullscreen">
        <v-icon>{{ fullscreenIcon }}</v-icon>
      </v-btn>
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
.window-component {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
}

.window-component.fullscreen {
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
