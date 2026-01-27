<template>
  <v-dialog v-model="modelValue" :persistent="persistent" max-width="420">
    <v-card class="pa-2">
      <v-card-title class="text-h6 font-weight-medium">
        {{ title }}
      </v-card-title>

      <v-card-text class="text-body-1">
        {{ message }}
      </v-card-text>

      <v-card-actions class="justify-end">
        <v-btn color="primary" variant="flat" @click="onConfirm">
          {{ confirmText }}
        </v-btn>

        <v-btn variant="text" @click="onCancel">
          {{ cancelText }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
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
  title = 'Confirm action',
  message = 'Are you sure?',
  confirmText = 'Leave',
  cancelText = 'Cancel',
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
