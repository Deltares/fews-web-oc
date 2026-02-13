<template>
  <v-dialog
    v-model="dialog"
    :fullscreen="mobile"
    hide-overlay
    :max-width="mobile ? undefined : '600'"
    :transition="mobile ? 'dialog-bottom-transition' : undefined"
  >
    <template #activator="{ props }">
      <slot name="activator" :props="props"></slot>
    </template>
    <v-card class="d-flex flex-column">
      <v-toolbar :title="title" density="compact">
        <v-btn
          size="small"
          icon
          @click="dialog = false"
          aria-label="Close Settings"
        >
          <v-icon size="small">mdi-close</v-icon>
        </v-btn>
      </v-toolbar>
      <v-card-text class="flex-grow-1 overflow-y-auto">
        <slot name="settings"></slot>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useDisplay } from 'vuetify'

interface Props {
  title: string
}
defineProps<Props>()

const { mobile } = useDisplay()
const dialog = ref(false)
</script>
