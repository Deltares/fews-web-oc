<template>
  <div class="dashboard-container ga-3 pa-3">
    <template v-for="group in groups">
      <template v-for="element in group.elements">
        <v-card
          :style="{ gridArea: element.gridTemplateArea }"
          class="d-flex flex-column"
          density="compact"
        >
          <!-- TODO: For now we only support one item per element -->
          <!--       to prevent UI clutter. -->
          <DashboardItem v-if="element.items" :item="element.items[0]" />
        </v-card>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { type WebOCDashboard } from '@deltares/fews-pi-requests'
import { computed, watch } from 'vue'
import DashboardItem from '@/components/general/DashboardItem.vue'
import { getResourcesStaticUrl } from '@/lib/fews-config'

interface Props {
  dashboard: WebOCDashboard
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

const cssUrl = computed(() =>
  getResourcesStaticUrl(props.dashboard.cssTemplate),
)
watch(
  cssUrl,
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
