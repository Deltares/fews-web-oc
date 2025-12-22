<template>
  <v-dialog
    v-model="dialog"
    persistent
    :fullscreen="mobile"
    hide-overlay
    :max-width="mobile ? undefined : '600'"
    :transition="mobile ? 'dialog-bottom-transition' : undefined"
  >
    <template #activator="{ props }">
      <slot name="activator" :props="props"></slot>
    </template>
    <v-card class="d-flex flex-column">
      <v-toolbar :title="t('userSettings.settings')" density="compact">
        <v-btn
          icon="mdi-close"
          @click="dialog = false"
          aria-label="Close User Settings"
        />
      </v-toolbar>
      <v-card-text class="flex-grow-1 overflow-y-auto">
        <UserSettings />
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import UserSettings from './UserSettings.vue'
import { useDisplay } from 'vuetify'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const { mobile } = useDisplay()
const dialog = ref(false)
</script>
