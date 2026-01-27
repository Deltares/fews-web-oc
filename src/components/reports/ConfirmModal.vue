<script setup lang="ts">
import { computed } from 'vue'

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
  'update:modelValue': [value: boolean]   
}

const {
  title = 'Confirm action',
  message = 'Are you sure?',
  confirmText = 'Leave',
  cancelText = 'Stay',
  persistent = true,
  modelValue
} = defineProps<Props>()

const emit = defineEmits<Emits>()

const dialog = computed({
  get: () => modelValue,
  set: (val: boolean) => emit('update:modelValue', val),
})

function onConfirm(): void {
  emit('confirm')
  emit('update:modelValue', false)
}

function onCancel(): void {
  emit('cancel')
  emit('update:modelValue', false)
}
</script>

<template>
  <v-dialog v-model="dialog" :persistent="persistent" max-width="420">
    <v-card class="pa-2">
      <v-card-title class="text-h6 font-weight-medium">
        {{ title }}
      </v-card-title>

      <v-card-text class="text-body-1">
        {{ message }}
      </v-card-text>

      <v-card-actions class="justify-end">
        <v-btn variant="text" @click="onCancel">
          {{ cancelText }}
        </v-btn>

        <v-btn color="error" variant="flat" @click="onConfirm">
          {{ confirmText }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
