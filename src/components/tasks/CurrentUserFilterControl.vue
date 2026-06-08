<template>
  <v-tooltip :text="tooltipText">
    <template #activator="{ props }">
      <v-btn
        v-bind="props"
        variant="tonal"
        class="px-1"
        min-width="36px"
        :color="color"
        @click="toggleShowCurrentUserOnly"
      >
        <v-icon :icon="icon" />
      </v-btn>
    </template>
  </v-tooltip>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const showCurrentUserOnly = defineModel<boolean>({ required: true })

const icon = computed<string>(() =>
  showCurrentUserOnly.value ? 'mdi-account' : 'mdi-account-multiple',
)
const color = computed<string | undefined>(() =>
  showCurrentUserOnly.value ? 'primary' : undefined,
)
const tooltipText = computed<string>(() =>
  showCurrentUserOnly.value
    ? t('workflow.showingCurrentUsersTaskOnly')
    : t('workflow.showingAllUsersTasks'),
)

function toggleShowCurrentUserOnly(): void {
  showCurrentUserOnly.value = !showCurrentUserOnly.value
}
</script>
