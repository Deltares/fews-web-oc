<template>
  <!-- Renderless component -->
  <slot />
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue'
import { NavigationGuardNext, onBeforeRouteUpdate } from 'vue-router'

interface Props {
  when: boolean
}

interface Emits {
  confirm: []
  cancel: []
}

const { when } = defineProps<Props>()

const emit = defineEmits<Emits>()

let pendingNext: NavigationGuardNext | null = null

// ---- Router navigation guard ----
onBeforeRouteUpdate((_to, _from, next) => {
  if (!when) {
    next()
    return
  }

  pendingNext = next
  emit('confirm')
})

// ---- Browser refresh / tab close ----
function handleBeforeUnload(event: BeforeUnloadEvent): void {
  if (!when) return
  event.preventDefault()
}

onMounted(() => {
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
