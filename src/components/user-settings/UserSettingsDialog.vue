<template>
  <v-dialog
    v-model="dialog"
    persistent
    :fullscreen="mobile"
    :max-width="mobile ? undefined : '600'"
  >
    <template #activator="{ props }">
      <slot name="activator" :props="props"></slot>
    </template>
    <v-card>
      <v-toolbar title="Settings" density="compact">
        <v-btn
          icon="mdi-close"
          @click="dialog = false"
          aria-label="Close User Settings"
        />
      </v-toolbar>
      <v-card-text>
        <UserSettings />
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import UserSettings from './UserSettings.vue'
import { useDisplay } from 'vuetify'

const { mobile } = useDisplay()
const dialog = ref(false)
</script>
