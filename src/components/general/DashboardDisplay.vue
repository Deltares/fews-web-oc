<template>
  <div class="dashboard-container">
    <template v-for="(panel, i) in dashboard.panels">
      <section
        :style="{
          backgroundColor: distinctColorFromIndex(i),
          gridArea: panel.id,
        }"
      >
        <h2 class="pa-5">{{ panel.id }}</h2>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { watch } from 'vue'

interface Panel {
  id: string
}

interface Dashboard {
  id: string
  title: string
  css: string
  panels: Panel[]
}

interface Props {
  dashboard: Dashboard
}

const props = defineProps<Props>()

function distinctColorFromIndex(index: number) {
  return `hsl(${(index * 137) % 360}, 50%, 50%)`
}

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
  () => props.dashboard.css,
  (newCss, oldCss) => {
    if (oldCss) removeCss(`/css/${oldCss}`)
    loadCss(`/css/${newCss}`)
  },
  { immediate: true },
)
</script>

<style scoped>
.dashboard-container {
  display: grid;
  height: 100%;
  width: 100%;
}
</style>
