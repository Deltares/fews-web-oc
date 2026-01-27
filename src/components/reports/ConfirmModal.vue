<template>
  <v-dialog v-model="modelValue" :persistent="persistent" max-width="420">
    <v-card class="pa-2">
      <v-card-title class="text-h6 font-weight-medium">
        {{ title ? title : t('common.confirmAction') }}
      </v-card-title>

      <v-card-text class="text-body-1">
        {{ message ? message : t('common.areYouSure') }}
      </v-card-text>

      <v-card-actions class="justify-end">
        <v-btn color="primary" variant="flat" @click="onConfirm">
          {{ confirmText ? confirmText : t('common.leave') }}
        </v-btn>

        <v-btn variant="text" @click="onCancel">
          {{ cancelText ? cancelText : t('common.cancel') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

interface Props {
  modelValue: boolean
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
  persistent?: boolean
}

interface Emits {
  confirm: []
  cancel: []
}

const {
  title,
  message,
  confirmText,
  cancelText,
  persistent = true,
} = defineProps<Props>()

const emit = defineEmits<Emits>()

const modelValue = defineModel<boolean>()

function onConfirm(): void {
  emit('confirm')
  modelValue.value = false
}

function onCancel(): void {
  emit('cancel')
  modelValue.value = false
}
</script>
