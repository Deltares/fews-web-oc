<template>
  <div class="dashboard-container ga-3 pa-3">
    <template v-for="group in groups">
      <template v-for="element in group.elements">
        <v-card
          :style="{ gridArea: element.gridTemplateArea }"
          class="d-flex flex-column"
          density="compact"
        >
          <DashboardItems :items="element.items" />
        </v-card>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { Dashboard } from '@/lib/dashboard/types'
import { computed, watch } from 'vue'
import DashboardItems from '@/components/general/DashboardItems.vue'

interface Props {
  dashboard: Dashboard
}

const props = defineProps<Props>()

const groups = computed(() => props.dashboard.groups)

function loadCss(url: string) {
  if (!document.querySelector(`link[href="${url}"]`)) {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = url
    document.head.appendChild(link)
  }
}

function removeCss(url: string) {
  const link = document.querySelector(`link[href="${url}"]`)
  if (link) {
    link.remove()
  }
}

watch(
  () => props.dashboard.cssTemplate,
  (newCss, oldCss) => {
    if (oldCss) removeCss(oldCss)
    loadCss(newCss)
  },
  { immediate: true },
)
</script>

<style scoped>
.dashboard-container {
  display: grid;
  background-color: color-mix(
    in srgb,
    rgb(var(--v-theme-on-surface-variant)) 90%,
    rgb(var(--v-theme-on-surface))
  );
  height: 100%;
  width: 100%;
}
</style>
