<template>
  <v-tooltip :text="tooltipText">
    <template #activator="{ props }">
      <v-chip
        v-bind="props"
        variant="tonal"
        pilled
        label
        class="ms-2 px-2"
        :color="color"
        @click="toggleShowCurrentUserOnly"
      >
        <v-icon :icon="icon" />
      </v-chip>
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
