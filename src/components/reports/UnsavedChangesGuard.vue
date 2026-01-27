<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue'
import { NavigationGuardNext, onBeforeRouteUpdate } from 'vue-router'

interface Props {
  when: boolean
  message?: string
}

const props = withDefaults(defineProps<Props>(), {
  message: 'You have unsaved changes. Are you sure you want to leave?',
})

const emit = defineEmits<{
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()

let pendingNext: NavigationGuardNext | null = null

// ---- Router navigation guard ----
onBeforeRouteUpdate((_to, _from, next) => {
  if (!props.when) {
    next()
    return
  }

  pendingNext = next
  emit('confirm')
})

// ---- Browser refresh / tab close ----
function handleBeforeUnload(event: BeforeUnloadEvent): void {
  if (!props.when) return

  event.preventDefault()
}

onMounted(() => {
  console.log('Mounting UnsavedChangesGuard and adding beforeunload listener')
  window.addEventListener('beforeunload', handleBeforeUnload)
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
})

// ---- Exposed methods ----
function allowNavigation(): void {
  if (pendingNext) {
    pendingNext()
    pendingNext = null
  }
}

function cancelNavigation(): void {
  if (pendingNext) {
    pendingNext(false)
    pendingNext = null
  }
}

defineExpose({
  allowNavigation,
  cancelNavigation,
})
</script>

<template>
  <!-- Renderless component -->
  <slot />
</template>
